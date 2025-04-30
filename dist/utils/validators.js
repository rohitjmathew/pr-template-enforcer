"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldSkipUser = exports.validateJiraTicketReference = exports.validatePullRequestDescription = void 0;
/**
 * Validates if a pull request description contains all required sections
 * @param description PR description text
 * @param requiredSections Array of section names that must be present
 * @returns True if all required sections are present
 */
function validatePullRequestDescription(description, requiredSections) {
    return requiredSections.every(section => description.includes(section));
}
exports.validatePullRequestDescription = validatePullRequestDescription;
/**
 * Validates if a pull request title contains a JIRA ticket reference
 * @param title PR title text
 * @param pattern Regular expression pattern for JIRA tickets
 * @returns True if title contains a valid JIRA ticket reference
 */
function validateJiraTicketReference(title, pattern = '[A-Z]+-\\d+') {
    const jiraTicketPattern = new RegExp(pattern);
    return jiraTicketPattern.test(title);
}
exports.validateJiraTicketReference = validateJiraTicketReference;
/**
 * Check if a username should be skipped based on skip lists
 * @param username GitHub username to check
 * @param skipUsers List of usernames to skip
 * @param skipServiceAccounts List of service account substrings to skip
 * @returns True if the user should be skipped
 */
function shouldSkipUser(username, skipUsers, skipServiceAccounts) {
    // Skip check for certain users if configured
    if (skipUsers.includes(username)) {
        return true;
    }
    // Skip check for service accounts if configured
    return skipServiceAccounts.some(account => username.includes(account));
}
exports.shouldSkipUser = shouldSkipUser;
