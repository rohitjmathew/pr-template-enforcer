import * as github from '@actions/github';
import * as core from '@actions/core';
import { ValidationResult } from './template-checker';

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
                    body: '### :white_check_mark: PR Template Validation Passed\n\nThis pull request complies with the template requirements.'
                });
            } catch (error) {
                // Log but continue execution
                core.warning(`Failed to create success comment: ${error instanceof Error ? error.message : String(error)}`);
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
                core.debug(`Label ${this.labelName} might not exist on PR #${prNumber}`);
            }
            
            // Create success check
            await this.createCheck(prNumber, 'success', 'PR template validation passed');
            
            core.info('Pull request description is compliant with the template.');
        } catch (error) {
            core.warning(`Failed to process success handling: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    /**
     * Format failure comment with validation errors
     * @param validationResult The validation result containing errors
     * @returns Formatted comment string
     */
    private formatFailureComment(validationResult: ValidationResult): string {
        return `### :x: PR Template Validation Failed\n\n${validationResult.errors.join('\n\n')}`;
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
                core.warning(`Failed to create failure comment: ${error instanceof Error ? error.message : String(error)}`);
            }
            
            // Add label 
            try {
                await this.octokit.rest.issues.addLabels({
                    ...this.context.repo,
                    issue_number: prNumber,
                    labels: [this.labelName]
                });
            } catch (error) {
                core.warning(`Failed to add label: ${error instanceof Error ? error.message : String(error)}`);
            }
            
            // Create failure check
            await this.createCheck(prNumber, 'failure', `PR template validation failed with errors:\n${validationResult.errors.join('\n')}`);
            
            // Set the action as failed
            core.setFailed(`Pull request does not comply with the template. ${validationResult.errors.join(', ')}`);
        } catch (error) {
            core.warning(`Failed to process failure handling: ${error instanceof Error ? error.message : String(error)}`);
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
                    title: conclusion === 'success' ? 'PR Template Valid' : 'PR Template Invalid',
                    summary
                }
            });
        } catch (error) {
            core.warning(`Failed to create check: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}