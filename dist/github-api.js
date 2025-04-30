"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubApi = void 0;
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
class GitHubApi {
    constructor(token, labelName) {
        this.octokit = github.getOctokit(token);
        this.context = github.context;
        this.labelName = labelName;
    }
    /**
     * Handle successful validation by adding a success comment and removing any invalid template label
     * @param prNumber Pull request number
     */
    handleSuccess(prNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                try {
                    // Add success comment
                    yield this.octokit.rest.issues.createComment(Object.assign(Object.assign({}, this.context.repo), { issue_number: prNumber, body: '### :white_check_mark: PR Template Validation Passed\n\nThis pull request complies with the template requirements.' }));
                }
                catch (error) {
                    // Log but continue execution
                    core.warning(`Failed to create success comment: ${error instanceof Error ? error.message : String(error)}`);
                }
                // Remove label if it exists
                try {
                    yield this.octokit.rest.issues.removeLabel(Object.assign(Object.assign({}, this.context.repo), { issue_number: prNumber, name: this.labelName }));
                }
                catch (error) {
                    // Label might not exist, that's fine
                    core.debug(`Label ${this.labelName} might not exist on PR #${prNumber}`);
                }
                // Create success check
                yield this.createCheck(prNumber, 'success', 'PR template validation passed');
                core.info('Pull request description is compliant with the template.');
            }
            catch (error) {
                core.warning(`Failed to process success handling: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    /**
     * Format failure comment with validation errors
     * @param validationResult The validation result containing errors
     * @returns Formatted comment string
     */
    formatFailureComment(validationResult) {
        return `### :x: PR Template Validation Failed\n\n${validationResult.errors.join('\n\n')}`;
    }
    /**
     * Handle failed validation by adding error comment and invalid template label
     * @param prNumber Pull request number
     * @param validationResult Result of the template validation
     */
    handleFailure(prNumber, validationResult) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Add errors as a comment
                try {
                    yield this.octokit.rest.issues.createComment(Object.assign(Object.assign({}, this.context.repo), { issue_number: prNumber, body: this.formatFailureComment(validationResult) }));
                }
                catch (error) {
                    core.warning(`Failed to create failure comment: ${error instanceof Error ? error.message : String(error)}`);
                }
                // Add label 
                try {
                    yield this.octokit.rest.issues.addLabels(Object.assign(Object.assign({}, this.context.repo), { issue_number: prNumber, labels: [this.labelName] }));
                }
                catch (error) {
                    core.warning(`Failed to add label: ${error instanceof Error ? error.message : String(error)}`);
                }
                // Create failure check
                yield this.createCheck(prNumber, 'failure', `PR template validation failed with errors:\n${validationResult.errors.join('\n')}`);
                // Set the action as failed
                core.setFailed(`Pull request does not comply with the template. ${validationResult.errors.join(', ')}`);
            }
            catch (error) {
                core.warning(`Failed to process failure handling: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    /**
     * Create a check run for the pull request
     * @param prNumber Pull request number
     * @param conclusion The check conclusion (success or failure)
     * @param summary Summary text for the check
     */
    createCheck(prNumber, conclusion, summary) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get the SHA for the PR head
                const pr = yield this.octokit.rest.pulls.get(Object.assign(Object.assign({}, this.context.repo), { pull_number: prNumber }));
                const headSha = pr.data.head.sha;
                // Create check run
                yield this.octokit.rest.checks.create(Object.assign(Object.assign({}, this.context.repo), { name: 'PR Template Validation', head_sha: headSha, status: 'completed', conclusion, output: {
                        title: conclusion === 'success' ? 'PR Template Valid' : 'PR Template Invalid',
                        summary
                    } }));
            }
            catch (error) {
                core.warning(`Failed to create check: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
}
exports.GitHubApi = GitHubApi;
