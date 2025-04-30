/**
 * Validates if a pull request description contains all required sections
 * @param description PR description text
 * @param requiredSections Array of section names that must be present
 * @returns True if all required sections are present
 */
export function validatePullRequestDescription(description: string, requiredSections: string[]): boolean {
    return requiredSections.every(section => description.includes(section));
}

/**
 * Validates if a pull request title contains a JIRA ticket reference
 * @param title PR title text
 * @param pattern Regular expression pattern for JIRA tickets
 * @returns True if title contains a valid JIRA ticket reference
 */
export function validateJiraTicketReference(title: string, pattern: string = '[A-Z]+-\\d+'): boolean {
    const jiraTicketPattern = new RegExp(pattern);
    return jiraTicketPattern.test(title);
}

/**
 * Check if a username should be skipped based on skip lists
 * @param username GitHub username to check
 * @param skipUsers List of usernames to skip
 * @param skipServiceAccounts List of service account substrings to skip
 * @returns True if the user should be skipped
 */
export function shouldSkipUser(
    username: string,
    skipUsers: string[],
    skipServiceAccounts: string[]
): boolean {
    // Skip check for certain users if configured
    if (skipUsers.includes(username)) {
        return true;
    }

    // Skip check for service accounts if configured
    return skipServiceAccounts.some(account => username.includes(account));
}