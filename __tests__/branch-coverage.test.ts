import { validateAgainstTemplate, parseMarkdownSections } from '../src/utils/template-parser';
import { TemplateChecker } from '../src/template-checker'; 
import { GitHubApi } from '../src/github-api';
import { parseJsonInput } from '../src/index';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { templates, requiredSectionSets } from './fixtures/templates';

// Mock dependencies
jest.mock('@actions/core');
jest.mock('@actions/github');

describe('Branch Coverage Tests', () => {
  
  // Test for template-checker.ts branch at line 34 (template ?? null)
  describe('TemplateChecker null coalescing branch', () => {
    it('should handle undefined template', () => {
      const checker = new TemplateChecker({
        requiredSections: ['## Test'],
        template: undefined
      });
      
      const result = checker.validateDescription('## Test\nContent', 'Title');
      expect(result.isValid).toBe(true);
    });
    
    it('should handle explicitly set null template', () => {
      const checker = new TemplateChecker({
        requiredSections: ['## Test'],
        template: null
      });
      
      const result = checker.validateDescription('## Test\nContent', 'Title');
      expect(result.isValid).toBe(true);
    });
  });
  
  // Test for template-parser.ts branch at line 69 (description.content || '')
  describe('TemplateParser content fallback branch', () => {
    it('should handle section with undefined content', () => {
      const { template, description } = templates.branchCoverage.emptyContent;
      
      // Create test sections that will produce a single known validation error
      const errors = validateAgainstTemplate(description, template, requiredSectionSets.singleSection, false);
      
      // We expect one error because the section is empty
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('appears to be empty');
    });
  });
  
  // Test for template-parser.ts branch at line 144 (descItems || [])
  describe('TemplateParser descItems fallback branch', () => {
    it('should handle section with undefined taskItems', () => {
      const { template, description } = templates.branchCoverage.taskItems;

      // This will trigger the branch for descItems || []
      const errors = validateAgainstTemplate(description, template, requiredSectionSets.checklistOnly, true);
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('missing its task list');
    });
  });
  
  // Test for github-api.ts branch at line 51
  describe('GitHubApi error branch', () => {
    let mockOctokit: any;
    let githubApi: GitHubApi;
    
    beforeEach(() => {
      jest.clearAllMocks();
      
      mockOctokit = {
        rest: {
          issues: {
            createComment: jest.fn(),
            addLabels: jest.fn(),
            removeLabel: jest.fn()
          },
          pulls: {
            get: jest.fn().mockResolvedValue({
              data: { head: { sha: 'test-sha' } }
            })
          },
          checks: {
            create: jest.fn().mockImplementation(() => {
              throw new Error('Test error that is not an Error instance');
            })
          }
        }
      };
      
      (github.getOctokit as jest.Mock).mockReturnValue(mockOctokit);
      (github.context as any) = { repo: { owner: 'test', repo: 'repo' } };
      
      githubApi = new GitHubApi('token', 'label');
    });
    
    it('should handle non-Error errors in createCheck', async () => {
      // Mock implementation to throw a string instead of an Error
      mockOctokit.rest.checks.create.mockImplementation(() => {
        throw 'String error';
      });
      
      // Call through a public method that uses createCheck
      await githubApi.handleSuccess(123);
      
      // Verify the error was logged with String()
      expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Failed to create check: String error'));
    });
  });
  
  // Test for template-parser.ts branches at line 204, 211 (error handling)
  describe('TemplateParser error handling branches', () => {
    it('should handle edge cases in section parsing', () => {
      const sections = parseMarkdownSections(templates.branchCoverage.malformedMarkdown);
      expect(sections.length).toBe(1);
    });
  });

  // Test for index.ts branch coverage
  describe('Index.ts branch coverage', () => {
    it('should handle invalid JSON in parseJsonInput', () => {
      (core.getInput as jest.Mock).mockReturnValue('invalid-json');
      (core.warning as jest.Mock).mockClear();
      
      const result = parseJsonInput('test-input', '[]');
      
      expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON format'));
      expect(result).toEqual([]);
    });
    
    it('should use default value for empty input', () => {
      (core.getInput as jest.Mock).mockReturnValue('');
      
      const result = parseJsonInput('test-input', '["default"]');
      
      expect(result).toEqual(['default']);
    });
  });
});