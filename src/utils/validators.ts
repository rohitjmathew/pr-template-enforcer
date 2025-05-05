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