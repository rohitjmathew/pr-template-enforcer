# PR Template Enforcer

A GitHub Action to enforce pull request template compliance and standardize PR descriptions across repositories.

## Key Features

- **Required Section Validation**: Ensures all required sections exist and aren't empty.
- **Smart Content Similarity Detection**: Uses a diff algorithm to detect when PR descriptions contain unmodified template content.
- **Task List Verification**: Validates that at least one checkbox is marked as complete (optional).
- **HTML Comment Stripping**: Ignores instructional comments when validating content.
- **Case-Insensitive Matching**: Handles variations in section title casing.
- **JIRA Ticket Reference Validation**: Validates PR titles against JIRA ticket patterns.
- **Skip Validation for Specific Users or Service Accounts**: Allows skipping validation for automation bots or specific accounts.
- **Automatic Labeling**: Labels non-compliant pull requests for easy identification.

---

## How It Works

### Section Validation

The enforcer checks that all required sections:
1. Exist in the PR description.
2. Aren't left empty.
3. Don't contain unmodified template content.
4. Have at least one task list item checked (when `require-task-completion` is enabled).

### Smart Content Similarity Detection

This feature uses the `diff` library to compare PR description content with the original template to ensure contributors haven't left template instructions unmodified.

1. **Basic Comparison**: Checks if content exactly matches the template.
2. **Diffing Algorithm**:
   - Breaks text into "word chunks" and identifies unchanged, added, and removed parts.
   - Produces a similarity score between 0 and 1 (0% to 100% similar).
3. **Threshold Check**: Content with >95% similarity to the template is flagged as unmodified.

---

## Usage

Add this action to your repository by creating `.github/workflows/pr-template.yml`:

```yaml
name: PR Template Check
on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  check-template:
    runs-on: ubuntu-latest
    steps:
      - uses: rohitjmathew/pr-template-enforcer@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          required-sections: '["## Summary", "## Changes", "## Testing"]'
          jira-pattern: '^[A-Z]+-\d+'
          skip-users: '["dependabot[bot]"]'
          skip-service-accounts: '["github-actions[bot]"]'
          require-task-completion: 'true'
          enforce-template: 'true'
          label-name: 'needs-more-info'
```

---

### Required Permissions

This action needs the following permissions to function correctly:

| Permission | Access Level | Description |
| --- | --- | --- |
| `contents` | `read` | Required to read the PR template files from your repository |
| `pull-requests` | `write` | Required to add labels to pull requests and post comments |

### Setting Custom Permissions

If you're using a restricted GitHub token or custom permissions setup, make sure these permissions are granted in your workflow file as shown in the example above.

```yaml
# Add these permissions to your workflow
permissions:
  contents: read
  pull-requests: write
```

For GitHub Enterprise or repositories with restricted settings, you may need to explicitly enable these permissions in your organization's settings.

For more information on GitHub Actions permissions, see the [GitHub documentation on workflow permissions](vscode-file://vscode-app/Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/code/electron-sandbox/workbench/workbench.html).

---

## Configuration Options

| Input                   | Description                                               | Required | Default                        |
|-------------------------|-----------------------------------------------------------|----------|--------------------------------|
| `github-token`          | GitHub token used to access repository content.           | Yes      | N/A                            |
| `required-sections`     | JSON array of section headers that must be present.       | No       | `["## Summary", "## Changes", "## Testing"]` |
| `jira-pattern`          | Regular expression to validate JIRA ticket references.    | No       | `'^[A-Z]+-\d+'`                |
| `skip-users`            | JSON array of GitHub usernames to skip validation.        | No       | `["dependabot[bot]"]`          |
| `skip-service-accounts` | JSON array of substrings to identify service accounts.    | No       | `["bot", "dependabot"]`        |
| `enforce-template`      | Whether to enforce template structure.                   | No       | `true`                         |
| `require-task-completion` | Require at least one checked task list item.           | No       | `false`                        |
| `label-name`            | Label to apply to non-compliant PRs.                      | No       | `'needs-description'`          |

---

## Debugging

The action provides detailed logs to help troubleshoot issues:
- **Normal mode**: Shows validation results and errors.
- **Debug mode**: Enabled with `ACTIONS_STEP_DEBUG=true`, provides detailed parsing information, similarity scores, and more.

---

## Examples

### Comprehensive Configuration

This configuration provides robust PR validation:

```yaml
- uses: rohitjmathew/pr-template-enforcer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    required-sections: '["## Summary", "## Changes", "## Testing"]'
    jira-pattern: '^[A-Z]+-\d+'
    skip-users: '["dependabot[bot]"]'
    skip-service-accounts: '["github-actions[bot]"]'
    require-task-completion: 'true'
    enforce-template: 'true'
    label-name: 'needs-more-info'
```

### Minimal Configuration

A basic configuration using default settings:

```yaml
- uses: rohitjmathew/pr-template-enforcer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Custom JIRA Ticket Validation

```yaml
- uses: rohitjmathew/pr-template-enforcer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    jira-pattern: 'PROJ-\d+'
```

### Skip Validation for Service Accounts

```yaml
- uses: rohitjmathew/pr-template-enforcer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    skip-service-accounts: '["bot", "dependabot", "renovate", "github-actions"]'
```

---

## License

This project is licensed under the [MIT License](LICENSE).