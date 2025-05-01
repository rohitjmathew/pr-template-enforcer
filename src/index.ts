import * as core from '@actions/core';
import * as github from '@actions/github';
import { TemplateChecker } from './template-checker';
import { shouldSkipUser } from './utils/validators';
import { GitHubApi } from './github-api';
import { getPRTemplate } from './utils/template-parser';

export async function run(): Promise<void> {
    try {
        // Get inputs and GitHub token
        const token = core.getInput('github-token', { required: true });
        const octokit = github.getOctokit(token);

        // Check if this is a pull request event
        const context = github.context;
        if (context.eventName !== 'pull_request') {
            core.info('This action only runs on pull request events.');
            return;
        }

        // Get PR details
        const pullRequest = context.payload.pull_request;
        if (!pullRequest) {
            throw new Error('Could not find pull request data in the event payload');
        }

        // Get TemplateChecker options from inputs
        const requiredSections = parseJsonInput('required-sections', '[]');
        const skipUsers = parseJsonInput('skip-users', '[]');
        const skipServiceAccounts = parseJsonInput('skip-service-accounts', '[]');
        const jiraPattern = core.getInput('jira-pattern') || '';
        const labelName = core.getInput('label-name') || 'invalid-template';
        const enforceTemplate = core.getBooleanInput('enforce-template') || false;
        const requireTaskCompletion = core.getBooleanInput('require-task-completion');

        // Initialize GitHub API handler
        const githubApi = new GitHubApi(token, labelName);

        // Check if user should be skipped
        const userLogin = pullRequest.user.login;
        if (shouldSkipUser(userLogin, skipUsers, skipServiceAccounts)) {
            core.info(`Skipping template check for user: ${userLogin}`);
            return;
        }

        // Get PR template if enforcing template
        let template: string | null = null;
        if (enforceTemplate) {
            core.info('Fetching repository PR template...');
            template = await getPRTemplate(
                octokit, 
                context.repo.owner, 
                context.repo.repo
            );
            
            if (template) {
                core.info('Repository PR template found.');
            } else {
                core.warning('No PR template found in repository. Will check for required sections only.');
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
            core.setFailed(`Action failed: ${error.message}`);
        } else {
            core.setFailed(`Action failed with an unknown error`);
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
        core.warning(`Invalid JSON format for input '${inputName}': ${input}. Using default value.`);
        return JSON.parse(defaultValue);
    }
}

// Entry point
if (require.main === module) {
    run();
}