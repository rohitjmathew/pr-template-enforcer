import { shouldSkipUser } from '../../src/utils/validators';
import { validateAgainstTemplate } from '../../src/utils/template-parser';
import { templates, jiraFormats, requiredSectionSets } from '../fixtures/templates';
import { TemplateChecker } from '../../src/template-checker';

describe('Validators', () => {
    describe('Template Validation', () => {
        it('should validate a description with required sections', () => {
            const errors = validateAgainstTemplate(
                templates.valid.description, 
                null,
                requiredSectionSets.standard
            );
            expect(errors.length).toBe(0);
        });

        it('should fail validation for a description missing required sections', () => {
            const errors = validateAgainstTemplate(
                templates.missing.description, 
                null,
                requiredSectionSets.standard
            );
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('JIRA Ticket Validation', () => {
        it('should validate a PR title with a JIRA ticket reference', () => {
            const checker = new TemplateChecker({
                requiredSections: [],
                jiraPattern: '[A-Z]+-\\d+'
            });
            
            const result = checker.validateDescription('', jiraFormats.standard);
            expect(result.isValid).toBe(true);
        });

        it('should fail validation for a title without a JIRA ticket reference', () => {
            const checker = new TemplateChecker({
                requiredSections: [],
                jiraPattern: '[A-Z]+-\\d+'
            });
            
            const result = checker.validateDescription('', 'Invalid title with no JIRA reference');
            expect(result.isValid).toBe(false);
        });
    });

    describe('shouldSkipUser', () => {
        it('should return true for users in the skip list', () => {
            const username = 'test-user';
            const skipUsers = ['test-user', 'admin-user'];
            const skipServiceAccounts = ['bot'];
            
            expect(shouldSkipUser(username, skipUsers, skipServiceAccounts)).toBe(true);
        });
        
        it('should return true for service accounts', () => {
            const username = 'dependabot[bot]';
            const skipUsers: string[] = [];
            const skipServiceAccounts = ['bot', 'dependabot'];
            
            expect(shouldSkipUser(username, skipUsers, skipServiceAccounts)).toBe(true);
        });
        
        it('should return false for regular users not in skip lists', () => {
            const username = 'regular-user';
            const skipUsers: string[] = [];
            const skipServiceAccounts: string[] = [];
            
            expect(shouldSkipUser(username, skipUsers, skipServiceAccounts)).toBe(false);
        });
        
        it('should handle empty arrays', () => {
            const username = 'any-user';
            const skipUsers: string[] = [];
            const skipServiceAccounts: string[] = [];
            
            expect(shouldSkipUser(username, skipUsers, skipServiceAccounts)).toBe(false);
        });
        
        it('should handle partial matches for service accounts', () => {
            const username = 'github-actions-bot';
            const skipUsers: string[] = [];
            const skipServiceAccounts = ['bot'];
            
            expect(shouldSkipUser(username, skipUsers, skipServiceAccounts)).toBe(true);
        });
    });
});