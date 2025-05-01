import { TemplateChecker } from '../src/template-checker';

describe('TemplateChecker', () => {
    test('should validate a compliant pull request description', () => {
        const checker = new TemplateChecker({
            requiredSections: ['## Description', '## JIRA Ticket']
        });
        
        const description = `
        ## Description
        This is a valid pull request.

        ## JIRA Ticket
        JIRA-1234
        `;
        
        const result = checker.validateDescription(description, 'JIRA-1234: Fix bug');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('should invalidate a pull request description missing required sections', () => {
        const checker = new TemplateChecker({
            requiredSections: ['## Description', '## JIRA Ticket']
        });
        
        const description = `
        This is an invalid pull request.
        `;
        
        const result = checker.validateDescription(description, 'Fix bug');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Missing required section: "## Description"');
        expect(result.errors).toContain('Missing required section: "## JIRA Ticket"');
    });

    test('should invalidate a pull request title without JIRA ticket reference when pattern is provided', () => {
        const checker = new TemplateChecker({
            requiredSections: [],
            jiraPattern: '[A-Z]+-\\d+'
        });
        
        const result = checker.validateDescription('Valid description', 'This is a pull request without a JIRA ticket');
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('PR title does not contain a valid JIRA ticket reference');
    });

    test('should validate a pull request title with a JIRA ticket reference when pattern is provided', () => {
        const checker = new TemplateChecker({
            requiredSections: [],
            jiraPattern: '[A-Z]+-\\d+'
        });
        
        const result = checker.validateDescription('Valid description', 'JIRA-1234: This is a valid pull request title');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    
    test('should not validate JIRA ticket when pattern is not provided', () => {
        const checker = new TemplateChecker({
            requiredSections: ['## Description']
        });
        
        const result = checker.validateDescription('## Description\nValid description', 'No JIRA ticket here');
        expect(result.isValid).toBe(true);
    });
    
    test('should not validate JIRA ticket when pattern is empty', () => {
        const checker = new TemplateChecker({
            requiredSections: ['## Description'],
            jiraPattern: ''
        });
        
        const result = checker.validateDescription('## Description\nValid description', 'No JIRA ticket here');
        expect(result.isValid).toBe(true);
    });
    
    test('should handle custom JIRA ticket patterns', () => {
        const checker = new TemplateChecker({
            requiredSections: [],
            jiraPattern: 'ABC-\\d+:'
        });
        
        const validResult = checker.validateDescription('Valid description', 'ABC-123: Valid title');
        expect(validResult.isValid).toBe(true);
        
        const invalidResult = checker.validateDescription('Valid description', 'DEF-123: Invalid title');
        expect(invalidResult.isValid).toBe(false);
    });
});