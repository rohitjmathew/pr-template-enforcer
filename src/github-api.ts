import * as github from '@actions/github';
import * as core from '@actions/core';
import { ValidationResult } from './template-checker';
import {
    GITHUB_API_MESSAGES,
    LOG_MESSAGES,
    ERROR_MESSAGES
} from './constants';

export class GitHubApi {
    private octokit: ReturnType<typeof github.getOctokit>;
    private context: typeof github.context;
    private labelName: string;

    constructor(token: string, labelName: string) {
        this.octokit = github.getOctokit(token);
        this.context = github.context;
        this.labelName = labelName;
    }

    /**
     * Handle successful validation by adding a success comment and removing any invalid template label
     * @param prNumber Pull request number
     */
    async handleSuccess(prNumber: number): Promise<void> {
        try {
            try {
                // Add success comment
                await this.octokit.rest.issues.createComment({
                    ...this.context.repo,
                    issue_number: prNumber,
                    body: `${GITHUB_API_MESSAGES.SUCCESS_COMMENT_TITLE}\n\n${GITHUB_API_MESSAGES.SUCCESS_COMMENT_BODY}`
                });
            } catch (error) {
                // Log but continue execution
                core.warning(GITHUB_API_MESSAGES.ERROR_CREATE_SUCCESS_COMMENT.replace('%s',
                    error instanceof Error ? error.message : String(error)));
            }

            // Remove label if it exists
            try {
                await this.octokit.rest.issues.removeLabel({
                    ...this.context.repo,
                    issue_number: prNumber,
                    name: this.labelName
                });
            } catch (error) {
                // Label might not exist, that's fine
                core.debug(GITHUB_API_MESSAGES.ERROR_REMOVE_LABEL
                    .replace('%s', this.labelName)
                    .replace('%d', prNumber.toString()));
            }

            // Create success check
            await this.createCheck(prNumber, 'success', GITHUB_API_MESSAGES.SUCCESS_CHECK_SUMMARY);

            core.info(LOG_MESSAGES.COMPLIANCE_SUCCESS);
        } catch (error) {
            core.warning(GITHUB_API_MESSAGES.ERROR_PROCESS_SUCCESS.replace('%s',
                error instanceof Error ? error.message : String(error)));
        }
    }

    /**
     * Format failure comment with validation errors
     * @param validationResult The validation result containing errors
     * @returns Formatted comment string
     */
    private formatFailureComment(validationResult: ValidationResult): string {
        return `${GITHUB_API_MESSAGES.FAILURE_COMMENT_TITLE}\n\n${validationResult.errors.join('\n\n')}${GITHUB_API_MESSAGES.FAILURE_COMMENT_FOOTER}`;
    }

    /**
     * Handle failed validation by adding error comment and invalid template label
     * @param prNumber Pull request number
     * @param validationResult Result of the template validation
     */
    async handleFailure(prNumber: number, validationResult: ValidationResult): Promise<void> {
        try {
            // Add errors as a comment
            try {
                await this.octokit.rest.issues.createComment({
                    ...this.context.repo,
                    issue_number: prNumber,
                    body: this.formatFailureComment(validationResult)
                });
            } catch (error) {
                core.warning(GITHUB_API_MESSAGES.ERROR_CREATE_FAILURE_COMMENT.replace('%s',
                    error instanceof Error ? error.message : String(error)));
            }

            // Add label 
            try {
                await this.octokit.rest.issues.addLabels({
                    ...this.context.repo,
                    issue_number: prNumber,
                    labels: [this.labelName]
                });
            } catch (error) {
                core.warning(GITHUB_API_MESSAGES.ERROR_ADD_LABEL.replace('%s',
                    error instanceof Error ? error.message : String(error)));
            }

            // Create failure check
            await this.createCheck(
                prNumber,
                'failure',
                `${GITHUB_API_MESSAGES.FAILURE_CHECK_SUMMARY}\n${validationResult.errors.join('\n')}`
            );

            // Set the action as failed
            core.setFailed(`${ERROR_MESSAGES.VALIDATION_FAILED} ${validationResult.errors.join(', ')}`);
        } catch (error) {
            core.warning(GITHUB_API_MESSAGES.ERROR_PROCESS_FAILURE.replace('%s',
                error instanceof Error ? error.message : String(error)));
        }
    }

    /**
     * Create a check run for the pull request
     * @param prNumber Pull request number
     * @param conclusion The check conclusion (success or failure)
     * @param summary Summary text for the check
     */
    private async createCheck(prNumber: number, conclusion: 'success' | 'failure', summary: string): Promise<void> {
        try {
            // Get the SHA for the PR head
            const pr = await this.octokit.rest.pulls.get({
                ...this.context.repo,
                pull_number: prNumber
            });

            const headSha = pr.data.head.sha;

            // Create check run
            await this.octokit.rest.checks.create({
                ...this.context.repo,
                name: 'PR Template Validation',
                head_sha: headSha,
                status: 'completed',
                conclusion,
                output: {
                    title: conclusion === 'success'
                        ? GITHUB_API_MESSAGES.SUCCESS_CHECK_TITLE
                        : GITHUB_API_MESSAGES.FAILURE_CHECK_TITLE,
                    summary
                }
            });
        } catch (error) {
            core.warning(GITHUB_API_MESSAGES.ERROR_CREATE_CHECK.replace('%s',
                error instanceof Error ? error.message : String(error)));
        }
    }
}