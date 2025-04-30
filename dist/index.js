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
exports.parseJsonInput = exports.run = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const template_checker_1 = require("./template-checker");
const validators_1 = require("./utils/validators");
const github_api_1 = require("./github-api");
const template_parser_1 = require("./utils/template-parser");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const requireTaskCompletion = core.getBooleanInput('require-task-completion') || false;
            // Initialize GitHub API handler
            const githubApi = new github_api_1.GitHubApi(token, labelName);
            // Check if user should be skipped
            const userLogin = pullRequest.user.login;
            if ((0, validators_1.shouldSkipUser)(userLogin, skipUsers, skipServiceAccounts)) {
                core.info(`Skipping template check for user: ${userLogin}`);
                return;
            }
            // Get PR template if enforcing template
            let template = null;
            if (enforceTemplate) {
                core.info('Fetching repository PR template...');
                template = yield (0, template_parser_1.getPRTemplate)(octokit, context.repo.owner, context.repo.repo);
                if (template) {
                    core.info('Repository PR template found.');
                }
                else {
                    core.warning('No PR template found in repository. Will check for required sections only.');
                }
            }
            // Initialize and run checker
            const templateChecker = new template_checker_1.TemplateChecker({
                requiredSections,
                jiraPattern,
                template: enforceTemplate ? template : null,
                requireTaskListsCompletion: requireTaskCompletion
            });
            const validationResult = templateChecker.validateDescription(pullRequest.body || '', pullRequest.title || '');
            if (!validationResult.isValid) {
                yield githubApi.handleFailure(pullRequest.number, validationResult);
            }
            else {
                yield githubApi.handleSuccess(pullRequest.number);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(`Action failed: ${error.message}`);
            }
            else {
                core.setFailed(`Action failed with an unknown error`);
            }
        }
    });
}
exports.run = run;
/**
 * Parse a JSON input value from GitHub Action
 * @param inputName The name of the input
 * @param defaultValue Default JSON string if input is not provided
 * @returns Parsed JSON value
 */
function parseJsonInput(inputName, defaultValue) {
    const input = core.getInput(inputName) || defaultValue;
    try {
        return JSON.parse(input);
    }
    catch (error) {
        core.warning(`Invalid JSON format for input '${inputName}': ${input}. Using default value.`);
        return JSON.parse(defaultValue);
    }
}
exports.parseJsonInput = parseJsonInput;
// Entry point
if (require.main === module) {
    run();
}
