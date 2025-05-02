import * as core from '@actions/core';
import * as github from '@actions/github';
import { TemplateChecker } from './template-checker';
import { shouldSkipUser } from './utils/validators';
import { GitHubApi } from './github-api';
import { getPRTemplate } from './utils/template-parser';
import { DEFAULT_VALUES, ERROR_MESSAGES, LOG_MESSAGES } from './constants';

export async function run(): Promise<void> {
    try {
        // Get inputs and GitHub token
        const token = core.getInput('github-token', { required: true });
        const octokit = github.getOctokit(token);

        // Check if this is a pull request event
        const context = github.context;
        if (context.eventName !== 'pull_request') {
            core.info(LOG_MESSAGES.NON_PR_EVENT);
            return;
        }

        // Get PR details
        const pullRequest = context.payload.pull_request;
        if (!pullRequest) {
            throw new Error(ERROR_MESSAGES.NO_PR_DATA);
        }

        // Get TemplateChecker options from inputs
        const requiredSections = parseJsonInput('required-sections', JSON.stringify(DEFAULT_VALUES.REQUIRED_SECTIONS));
        const skipUsers = parseJsonInput('skip-users', JSON.stringify(DEFAULT_VALUES.SKIP_USERS));
        const skipServiceAccounts = parseJsonInput('skip-service-accounts', JSON.stringify(DEFAULT_VALUES.SKIP_SERVICE_ACCOUNTS));
        const jiraPattern = core.getInput('jira-pattern') || DEFAULT_VALUES.JIRA_PATTERN;
        const labelName = core.getInput('label-name') || DEFAULT_VALUES.LABEL_NAME;
        const enforceTemplate = core.getBooleanInput('enforce-template') || false;
        const requireTaskCompletion = core.getBooleanInput('require-task-completion');

        // Initialize GitHub API handler
        const githubApi = new GitHubApi(token, labelName);

        // Check if user should be skipped
        const userLogin = pullRequest.user.login;
        if (shouldSkipUser(userLogin, skipUsers, skipServiceAccounts)) {
            core.info(LOG_MESSAGES.SKIPPING_USER.replace('%s', userLogin));
            return;
        }

        // Get PR template if enforcing template
        let template: string | null = null;
        if (enforceTemplate) {
            core.info(LOG_MESSAGES.FETCHING_TEMPLATE);
            template = await getPRTemplate(
                octokit,
                context.repo.owner,
                context.repo.repo
            );

            if (template) {
                core.info(LOG_MESSAGES.TEMPLATE_FOUND);
            } else {
                core.warning(ERROR_MESSAGES.NO_TEMPLATE);
            }
        }

        const templateChecker = new TemplateChecker({
            requiredSections,
            jiraPattern,
            template: enforceTemplate ? template : null,
            requireTaskListsCompletion: requireTaskCompletion
        });

        // Make sure validation results are properly processed
        const validationResult = templateChecker.validateDescription(pullRequest.body || '', pullRequest.title || '');

        if (!validationResult.isValid) {
            await githubApi.handleFailure(pullRequest.number, validationResult);
        } else {
            await githubApi.handleSuccess(pullRequest.number);
        }
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(ERROR_MESSAGES.ACTION_FAILED_ERROR.replace('%s', error.message));
        } else {
            core.setFailed(ERROR_MESSAGES.ACTION_FAILED_UNKNOWN);
        }
    }
}

/**
 * Parse a JSON input value from GitHub Action
 * @param inputName The name of the input
 * @param defaultValue Default JSON string if input is not provided
 * @returns Parsed JSON value
 */
export function parseJsonInput(inputName: string, defaultValue: string): any {
    const input = core.getInput(inputName) || defaultValue;
    try {
        return JSON.parse(input);
    } catch (error) {
        core.warning(ERROR_MESSAGES.INVALID_JSON.replace('%s', inputName).replace('%s', input));
        return JSON.parse(defaultValue);
    }
}

// Entry point
if (require.main === module) {
    run();
}