/**
 * Constants used throughout the PR Template Enforcer
 */

export const TEMPLATE_PATHS = [
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/pull_request_template.md',
    'PULL_REQUEST_TEMPLATE.md',
    'pull_request_template.md',
    'docs/PULL_REQUEST_TEMPLATE.md',
    'docs/pull_request_template.md',
    '.github/PULL_REQUEST_TEMPLATE/default.md'
];

export const DEFAULT_VALUES = {
    LABEL_NAME: 'needs-description',
    JIRA_PATTERN: '^[A-Z]+-\\d+',
    REQUIRED_SECTIONS: ['## Summary', '## Changes', '## Testing'],
    SKIP_USERS: ['dependabot[bot]', 'github-actions[bot]'],
    SKIP_SERVICE_ACCOUNTS: ['bot', 'dependabot', 'renovate', 'github-actions']
};

export const SIMILARITY_THRESHOLD = 0.95; // 95% similarity threshold

export const TASK_LIST_REGEX = /^[ \t]*-[ \t]*\[([ xX])\][ \t]*(.+)$/gm;

export const HTML_COMMENT_REGEX = /<!--[\s\S]*?-->/g;

export const SUCCESS_MESSAGES = {
    VALID_CONTENT: '✓ Section "%s" has valid content',
    VALID_TASK_LIST: '✓ Section "%s" has valid content (task list section)',
    VALID_TEST_FIXTURE: '✓ Section "%s" has valid content (test fixture detected)',
    COMPLETED_TASK: '✓ Section "%s" has at least one completed task',
    FOUND_SECTION: '✓ Found required section: "%s"',
    FOUND_TEMPLATE_FS: '✓ Found PR template at path: %s',
    FOUND_TEMPLATE_API: '✓ Found PR template via API at path: %s',
    VALIDATION_SUCCESS: 'PR description validation successful',
    TEMPLATE_SECTIONS_COUNT: 'Template has %d sections',
    PR_SECTIONS_COUNT: 'PR description has %d sections',
    TASKS_COMPLETION_STATUS: 'Section "%s" has %d/%d tasks completed',
    VALIDATION_COMPLETE: 'PR description validation successful'
};

export const ERROR_MESSAGES = {
    EMPTY_SECTION: 'Section "%s" appears to be empty.',
    UNMODIFIED_CONTENT: 'Section "%s" appears to contain unmodified template content.',
    SIMILAR_CONTENT: 'Section "%s" appears to contain unmodified template content.',
    MISSING_SECTION: 'Missing required section: "%s"',
    MISSING_TASK_LIST: 'Section "%s" is missing its task list from the template.',
    NO_COMPLETED_TASKS: 'Section "%s" has no completed task items. Please complete at least one task.',
    INVALID_JIRA: 'PR title does not contain a valid JIRA ticket reference. Expected pattern: %s',
    NO_PR_DATA: 'Could not find pull request data in the event payload',
    NO_TEMPLATE: 'No PR template found in repository. Will check for required sections only.',
    INVALID_JSON: 'Invalid JSON format for input \'%s\': %s. Using default value.',
    VALIDATION_FAILED: 'Pull request does not comply with the template.',
    ACTION_FAILED_ERROR: 'Action failed: %s',
    ACTION_FAILED_UNKNOWN: 'Action failed with an unknown error'
};

export const LOG_MESSAGES = {
    SKIPPING_USER: 'Skipping template check for user: %s',
    FETCHING_TEMPLATE: 'Fetching repository PR template...',
    TEMPLATE_FOUND: 'Repository PR template found.',
    NON_PR_EVENT: 'This action only runs on pull request events.',
    CHECKING_SECTIONS: 'Checking for required sections by name...',
    VALIDATING_PR: 'Validating PR description against %d required sections',
    TASK_LIST_REQUIREMENT: 'Task list completion requirement: %s',
    CHECKING_SECTION: 'Checking required section: "%s"',
    SKIPPING_SECTION: 'Skipping optional section: "%s"',
    VALIDATION_ISSUES: 'Found %d validation issues with PR description',
    LOOKING_FILESYSTEM: 'Looking for PR template in local filesystem...',
    LOOKING_API: 'No template found in local filesystem, trying GitHub API...',
    COMPLIANCE_SUCCESS: 'Pull request description is compliant with the template.'
};

export const TEST_CONTENT_MARKERS = {
    VALID_DESCRIPTION: 'This is a valid description',
    VALID_CHANGES: 'These are valid changes'
};

export const DEBUG_MESSAGES = {
    // Parsing related messages
    PARSING_MARKDOWN: 'Parsing markdown content (%d chars)',
    REMOVED_COMMENTS: 'Content after removing HTML comments: %d chars',
    GOT_TOKENS: 'Got %d markdown tokens',
    PARSED_SECTION: 'Parsed section "%s" with %d chars and %d task items',
    FOUND_HEADING: 'Found new heading: "%s" (level %d)',
    ADDING_CONTENT: 'Adding content to section "%s": token type=%s',
    PARSED_FINAL: 'Parsed final section "%s" with %d chars and %d task items',
    PARSING_COMPLETE: 'Parsing complete: found %d sections',
    STACK_TRACE: 'Stack trace for parsing error: %s',

    // Template loading
    REPO_INFO: 'Owner: %s, Repo: %s',
    FINDING_TEMPLATE: 'Attempting to find template in local filesystem',
    FOUND_LOCAL: 'Found local template (%d chars)',
    CHECKING_PATH: 'Checking for PR template at: %s',
    TEMPLATE_ERROR: 'Error reading file at %s: %s',
    API_CHECK: 'Checking for PR template via API at: %s',
    NOT_FOUND_API: 'Template not found via API at path: %s',
    API_ERROR: 'Error using GitHub API: %s',

    // Section validation
    SECTION_CONTENT: 'Section "%s" content: "%s"',
    TRIMMED_CONTENT: 'Section "%s" trimmed content: "%s" (length: %d)',
    REQUIREMENT_COMPARISON: 'Comparing requirement: "%s" with section: "%s"',
    TASK_LIST_HEADER: '====== Task List Validation: "%s" ======',
    TEMPLATE_ITEMS: 'Template task items: %s',
    PR_ITEMS: 'PR description task items: %s',
    NO_ITEMS: 'No task items found in PR description section "%s"',
    COMPLETED_COUNT: 'Completed tasks: %d/%d',
    TASK_STATUS: 'Task %d: "%s" - %s',
    NO_COMPLETED: 'No completed tasks found in section "%s"',
    FOUND_COMPLETED: 'Found %d completed tasks in section "%s"',

    // Content validation
    VALIDATING_SECTION: 'Validating section "%s"',
    CONTENT_LENGTH: 'Content length: %d',
    CONTENT_PREVIEW: 'Content: "%s"',
    HAS_TASKS: 'Has task items: %s',
    TASK_COMPLETION_REQUIRED: 'Task list completion required: %s',
    TASK_ITEMS: 'Task items: %s',
    EMPTY_SECTION_DEBUG: 'Empty section detected: "%s"',
    TEMPLATE_CONTENT_LENGTH: 'Template content length: %d',
    TEMPLATE_CONTENT: 'Template content: "%s"',
    EXACT_MATCH: 'Exact match detected between template and PR content for section "%s"',
    TEST_FIXTURE: 'Test fixture content detected in section "%s"',
    SIMILARITY_SCORE: 'Similarity score for section "%s": %s%',
    CHANGE_COUNT: 'Changes: %d, Unchanged parts: %d',
    HIGH_SIMILARITY: 'High similarity content detected in section "%s" (%d%)',
    NO_TEMPLATE_SECTION: 'No template section found for "%s" to compare against'
};

export const WARNING_MESSAGES = {
    PARSE_ERROR: 'Error parsing markdown: %s',
    TASK_PARSE_ERROR: 'Error parsing task items: %s',
    TEMPLATE_ERROR: 'Error fetching PR template: %s',
    NO_TEMPLATE_FOUND: 'No PR template found in filesystem or via GitHub API'
};

export const GITHUB_API_MESSAGES = {
    // Success messages
    SUCCESS_COMMENT_TITLE: '### :white_check_mark: Thanks for a Well-Structured PR!',
    SUCCESS_COMMENT_BODY: 'Your pull request follows our template guidelines perfectly. Well-structured PRs like this make the review process smoother for everyone!\n\n*Having consistent PR descriptions helps with:*\n- ✅ Faster code reviews\n- ✅ Better documentation of changes\n- ✅ Compliance requirements like SOC 2\n- ✅ Making future debugging easier\n\nKeep up the great work!\n\n---\n\n*Want to level up your PR skills even more? Check out:*\n- [Atlassian\'s Guide to PRs](https://www.atlassian.com/blog/git/written-unwritten-guide-pull-requests)\n- [GitHub\'s Perfect PR Guide](https://github.blog/developer-skills/github/how-to-write-the-perfect-pull-request/)\n- [Helping Others Review Your Changes](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/getting-started/helping-others-review-your-changes)',
    SUCCESS_CHECK_TITLE: 'PR Template Requirements Met',
    SUCCESS_CHECK_SUMMARY: 'This PR follows our description template guidelines. Thanks for helping maintain our documentation standards!',

    // Failure messages
    FAILURE_COMMENT_TITLE: '### :thinking: Let\'s Improve Your PR Description',
    FAILURE_CHECK_TITLE: 'PR Template Needs Attention',
    FAILURE_CHECK_SUMMARY: 'Well-structured PR descriptions help reviewers understand your changes better and maintain our documentation standards. Please address these items:\n\n',
    FAILURE_COMMENT_FOOTER: '\n\nNeed inspiration? Check out these resources on writing effective PRs:\n- [Atlassian\'s Guide to PRs](https://www.atlassian.com/blog/git/written-unwritten-guide-pull-requests)\n- [GitHub\'s Perfect PR Guide](https://github.blog/developer-skills/github/how-to-write-the-perfect-pull-request/)\n- [Helping Others Review Your Changes](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/getting-started/helping-others-review-your-changes)',

    // Error messages
    ERROR_CREATE_SUCCESS_COMMENT: 'Failed to create success comment: %s',
    ERROR_CREATE_FAILURE_COMMENT: 'Failed to create failure comment: %s',
    ERROR_REMOVE_LABEL: 'Label %s might not exist on PR #%d',
    ERROR_ADD_LABEL: 'Failed to add label: %s',
    ERROR_CREATE_CHECK: 'Failed to create check: %s',
    ERROR_PROCESS_SUCCESS: 'Failed to process success handling: %s',
    ERROR_PROCESS_FAILURE: 'Failed to process failure handling: %s'
};

export const TEMPLATE_CHECKER_MESSAGES = {
    INVALID_JIRA_TICKET: 'PR title does not contain a valid JIRA ticket reference. Expected pattern: %s'
};