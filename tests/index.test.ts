import * as core from '@actions/core';
import * as github from '@actions/github';
import { TemplateChecker } from '../src/template-checker';
import { shouldSkipUser } from '../src/utils/validators';
import { GitHubApi } from '../src/github-api';
import { getPRTemplate } from '../src/utils/template-parser';
import { run, parseJsonInput } from '../src/index';

// Mock all dependencies
jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('../src/template-checker');
jest.mock('../src/utils/validators');
jest.mock('../src/github-api');
jest.mock('../src/utils/template-parser');

describe('Index Module Tests', () => {
    let mockOctokit: any;
    let mockGitHubApi: any;
    let mockTemplateChecker: any;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup GitHub Context mock
        (github.context as any) = {
            eventName: 'pull_request',
            repo: {
                owner: 'test-owner',
                repo: 'test-repo'
            },
            payload: {
                pull_request: {
                    number: 123,
                    body: '## Test\nThis is a test PR',
                    title: 'TEST-123: Test PR',
                    user: {
                        login: 'testuser'
                    }
                }
            }
        };
        
        // Mock octokit
        mockOctokit = {
            rest: {
                repos: {
                    getContent: jest.fn()
                }
            }
        };
        (github.getOctokit as jest.Mock).mockReturnValue(mockOctokit);
        
        // Mock core inputs
        (core.getInput as jest.Mock).mockImplementation((name: string) => {
            switch (name) {
                case 'github-token': return 'mock-token';
                case 'jira-pattern': return 'TEST-\\d+';
                case 'label-name': return 'needs-template-fix';
                default: return '';
            }
        });
        
        (core.getBooleanInput as jest.Mock).mockReturnValue(true);
        
        // Mock GitHubApi
        mockGitHubApi = {
            handleSuccess: jest.fn().mockResolvedValue(undefined),
            handleFailure: jest.fn().mockResolvedValue(undefined)
        };
        (GitHubApi as jest.Mock).mockImplementation(() => mockGitHubApi);
        
        // Mock TemplateChecker
        mockTemplateChecker = {
            validateDescription: jest.fn()
        };
        (TemplateChecker as jest.Mock).mockImplementation(() => mockTemplateChecker);
        
        // Mock other utilities
        (shouldSkipUser as jest.Mock).mockReturnValue(false);
        (getPRTemplate as jest.Mock).mockResolvedValue('# Mock Template');
    });
    
    describe('run function', () => {
        it('should handle successful validation', async () => {
            // Mock successful validation
            mockTemplateChecker.validateDescription.mockReturnValue({
                isValid: true,
                errors: []
            });
            
            // Execute
            await run();
            
            // Verify
            expect(mockGitHubApi.handleSuccess).toHaveBeenCalledWith(123);
            expect(mockGitHubApi.handleFailure).not.toHaveBeenCalled();
            expect(core.setFailed).not.toHaveBeenCalled();
        });
        
        it('should handle validation failure', async () => {
            // Mock validation failure
            const validationResult = {
                isValid: false,
                errors: ['Missing required section']
            };
            mockTemplateChecker.validateDescription.mockReturnValue(validationResult);
            
            // Execute
            await run();
            
            // Verify
            expect(mockGitHubApi.handleFailure).toHaveBeenCalledWith(123, validationResult);
            expect(mockGitHubApi.handleSuccess).not.toHaveBeenCalled();
            expect(core.setFailed).not.toHaveBeenCalled();
        });
        
        it('should skip processing for non-PR events', async () => {
            // Change context to non-PR event
            (github.context as any).eventName = 'push';
            
            // Execute
            await run();
            
            // Verify
            expect(core.info).toHaveBeenCalledWith('This action only runs on pull request events.');
            expect(TemplateChecker).not.toHaveBeenCalled();
            expect(mockGitHubApi.handleSuccess).not.toHaveBeenCalled();
            expect(mockGitHubApi.handleFailure).not.toHaveBeenCalled();
        });
        
        it('should throw error if PR data is missing', async () => {
            // Remove PR from payload
            (github.context as any).payload.pull_request = undefined;
            
            // Execute
            await run();
            
            // Verify
            expect(core.setFailed).toHaveBeenCalledWith(
                expect.stringContaining('Could not find pull request data')
            );
        });
        
        it('should skip validation for skipped users', async () => {
            // Mock shouldSkipUser to return true
            (shouldSkipUser as jest.Mock).mockReturnValue(true);
            
            // Execute
            await run();
            
            // Verify
            expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Skipping template check'));
            expect(mockTemplateChecker.validateDescription).not.toHaveBeenCalled();
            expect(mockGitHubApi.handleSuccess).not.toHaveBeenCalled();
        });
        
        it('should fetch PR template when enforce-template is true', async () => {
            // Configure mocks
            mockTemplateChecker.validateDescription.mockReturnValue({ isValid: true, errors: [] });
            
            // Execute
            await run();
            
            // Verify
            expect(getPRTemplate).toHaveBeenCalledWith(
                mockOctokit,
                'test-owner',
                'test-repo'
            );
            expect(TemplateChecker).toHaveBeenCalledWith(expect.objectContaining({
                template: '# Mock Template'
            }));
        });
        
        it('should handle missing PR template', async () => {
            // Mock no template found
            (getPRTemplate as jest.Mock).mockResolvedValue(null);
            mockTemplateChecker.validateDescription.mockReturnValue({ isValid: true, errors: [] });
            
            // Execute
            await run();
            
            // Verify
            expect(core.warning).toHaveBeenCalledWith(
                expect.stringContaining('No PR template found')
            );
            expect(TemplateChecker).toHaveBeenCalledWith(expect.objectContaining({
                template: null
            }));
        });
        
        it('should handle exceptions during execution', async () => {
            // Mock an exception
            (TemplateChecker as jest.Mock).mockImplementation(() => {
                throw new Error('Test error');
            });
            
            // Execute
            await run();
            
            // Verify
            expect(core.setFailed).toHaveBeenCalledWith('Action failed: Test error');
        });
        
        it('should handle non-error exceptions', async () => {
            // Mock a non-Error exception
            (TemplateChecker as jest.Mock).mockImplementation(() => {
                throw 'String error';
            });
            
            // Execute
            await run();
            
            // Verify
            expect(core.setFailed).toHaveBeenCalledWith('Action failed with an unknown error');
        });
    });
    
    describe('parseJsonInput function', () => {
        beforeEach(() => {
            // Expose the function for testing
            jest.resetModules();
            jest.mock('@actions/core');
        });
        
        it('should parse valid JSON input', () => {
            (core.getInput as jest.Mock).mockReturnValue('["test"]');
            
            const result = parseJsonInput('test-input', '[]');
            
            expect(result).toEqual(['test']);
        });
        
        it('should use default value for empty input', () => {
            (core.getInput as jest.Mock).mockReturnValue('');
            
            const result = parseJsonInput('test-input', '["default"]');
            
            expect(result).toEqual(['default']);
        });
        
        it('should handle invalid JSON and use default', () => {
            (core.getInput as jest.Mock).mockReturnValue('invalid-json');
            
            const result = parseJsonInput('test-input', '[]');
            
            expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON format'));
            expect(result).toEqual([]);
        });
    });
});