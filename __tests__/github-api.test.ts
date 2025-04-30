import * as github from '@actions/github';
import * as core from '@actions/core';
import { GitHubApi } from '../src/github-api';
import { ValidationResult } from '../src/template-checker';

// Mock the dependencies
jest.mock('@actions/github');
jest.mock('@actions/core');

describe('GitHubApi', () => {
    let mockOctokit: any;
    let githubApi: GitHubApi;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mock for octokit
        mockOctokit = {
            rest: {
                issues: {
                    createComment: jest.fn().mockResolvedValue({}),
                    addLabels: jest.fn().mockResolvedValue({}),
                    removeLabel: jest.fn().mockResolvedValue({})
                },
                pulls: {
                    get: jest.fn().mockResolvedValue({
                        data: { head: { sha: 'test-sha' } }
                    })
                },
                checks: {
                    create: jest.fn().mockResolvedValue({})
                }
            }
        };
        
        (github.getOctokit as jest.Mock).mockReturnValue(mockOctokit);
        
        // Setup github context
        (github as any).context = {
            repo: {
                owner: 'owner',
                repo: 'repo'
            },
            payload: {
                pull_request: { number: 123 }
            }
        };
        
        // Initialize the API
        githubApi = new GitHubApi('fake-token', 'invalid-template');
    });
    
    describe('handleSuccess', () => {
        it('should add success comment, remove label and create success check', async () => {
            await githubApi.handleSuccess(123);
            
            // Verify comment was created
            expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                issue_number: 123,
                body: expect.stringContaining('PR Template Validation Passed')
            });
            
            // Verify label was removed
            expect(mockOctokit.rest.issues.removeLabel).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                issue_number: 123,
                name: 'invalid-template'
            });
            
            // Verify check was created
            expect(mockOctokit.rest.checks.create).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                name: 'PR Template Validation',
                head_sha: 'test-sha',
                status: 'completed',
                conclusion: 'success',
                output: expect.objectContaining({
                    title: 'PR Template Valid'
                })
            });
            
            // Verify logging
            expect(core.info).toHaveBeenCalledWith(expect.stringContaining('compliant'));
        });
        
        it('should handle label removal error gracefully', async () => {
            // Setup removal error
            mockOctokit.rest.issues.removeLabel.mockRejectedValueOnce(new Error('Label not found'));
            
            await githubApi.handleSuccess(123);
            
            // Verify other operations still executed
            expect(mockOctokit.rest.issues.createComment).toHaveBeenCalled();
            expect(mockOctokit.rest.checks.create).toHaveBeenCalled();
            expect(core.debug).toHaveBeenCalledWith(expect.stringContaining('might not exist'));
        });

        it('should handle comment error gracefully', async () => {
            // Setup comment error 
            mockOctokit.rest.issues.createComment.mockRejectedValueOnce(new Error('Comment failed'));
            
            await githubApi.handleSuccess(123);
            
            // Should continue with other operations
            expect(mockOctokit.rest.issues.removeLabel).toHaveBeenCalled();
            expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Failed to create success comment'));
        });

        it('should handle PR fetch error gracefully', async () => {
            // Setup error in PR fetch 
            mockOctokit.rest.pulls.get.mockRejectedValueOnce(new Error('PR not found'));
            
            await githubApi.handleSuccess(123);
            
            // Should continue with other operations
            expect(mockOctokit.rest.issues.createComment).toHaveBeenCalled(); 
            expect(mockOctokit.rest.issues.removeLabel).toHaveBeenCalled();
            expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Failed to create check'));
        });
        
        it('should handle check creation error gracefully', async () => {
            // Setup error in check creation
            mockOctokit.rest.checks.create.mockRejectedValueOnce(new Error('Check failed'));
            
            await githubApi.handleSuccess(123);
            
            // Should log warning
            expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Failed to create check'));
        });
    });
    
    describe('handleFailure', () => {
        const validationResult: ValidationResult = {
            isValid: false,
            errors: ['Missing section: Description', 'Invalid JIRA ticket']
        };
        
        it('should add failure comment, add label and create failure check', async () => {
            await githubApi.handleFailure(123, validationResult);
            
            // Verify comment was created
            expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                issue_number: 123,
                body: expect.stringContaining('PR Template Validation Failed')
            });
            
            // Verify label was added
            expect(mockOctokit.rest.issues.addLabels).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                issue_number: 123,
                labels: ['invalid-template']
            });
            
            // Verify check was created
            expect(mockOctokit.rest.checks.create).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                name: 'PR Template Validation',
                head_sha: 'test-sha',
                status: 'completed',
                conclusion: 'failure',
                output: expect.objectContaining({
                    title: 'PR Template Invalid'
                })
            });
            
            // Verify logging and status
            expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('does not comply'));
        });

        it('should handle comment error gracefully', async () => {
            // Setup API error
            mockOctokit.rest.issues.createComment.mockRejectedValueOnce(new Error('API error'));
            
            await githubApi.handleFailure(123, validationResult);
            
            // Should log the warning
            expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Failed to create failure comment'));
            
            // Should still try to add the label and create the check
            expect(mockOctokit.rest.issues.addLabels).toHaveBeenCalled();
        });

        it('should handle labels error gracefully', async () => {
            // Setup label error
            mockOctokit.rest.issues.addLabels.mockRejectedValueOnce(new Error('Label error'));
            
            await githubApi.handleFailure(123, validationResult);
            
            // Should still create comment and log error
            expect(mockOctokit.rest.issues.createComment).toHaveBeenCalled();
            expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Failed to add label'));
        });
        
        it('should handle check creation error in failure case', async () => {
            // Setup check error
            mockOctokit.rest.checks.create.mockRejectedValueOnce(new Error('Check error'));
            
            await githubApi.handleFailure(123, validationResult);
            
            // Should log warning
            expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Failed to create check'));
            
            // Should still set failed status
            expect(core.setFailed).toHaveBeenCalled();
        });
    });
});