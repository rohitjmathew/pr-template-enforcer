import { validatePullRequestDescription, validateJiraTicketReference, shouldSkipUser } from '../../src/utils/validators';
import { templates, jiraFormats, requiredSectionSets } from '../fixtures/templates';

describe('Validators', () => {
    describe('validatePullRequestDescription', () => {
        it('should return true for a valid description', () => {
            expect(validatePullRequestDescription(
                templates.valid.description, 
                requiredSectionSets.standard
            )).toBe(true);
        });

        it('should return false for a description missing required sections', () => {
            expect(validatePullRequestDescription(
                templates.missing.description, 
                requiredSectionSets.standard
            )).toBe(false);
        });
    });

    describe('validateJiraTicketReference', () => {
        it('should return true for a valid JIRA ticket reference', () => {
            expect(validateJiraTicketReference(jiraFormats.standard)).toBe(true);
        });

        it('should return false for a title without a JIRA ticket reference', () => {
            expect(validateJiraTicketReference(jiraFormats.invalid)).toBe(false);
        });
        
        it('should validate against a custom pattern', () => {
            expect(validateJiraTicketReference(jiraFormats.custom, 'ABC-\\d+:')).toBe(true);
            expect(validateJiraTicketReference(jiraFormats.custom, 'XYZ-\\d+')).toBe(false);
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