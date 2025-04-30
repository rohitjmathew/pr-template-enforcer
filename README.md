PR Template Enforcer
====================

A GitHub Action to enforce pull request template compliance and standardize PR descriptions across your repositories.

TEST
Features
--------

-   Validates pull request descriptions against required sections
-   Enforces repository PR template structure
-   Supports JIRA ticket reference validation in PR titles
-   Validates task list completion
-   Allows skipping validation for specific users and service accounts
-   Automatically labels non-compliant pull requests
-   Provides detailed feedback on missing or invalid sections

Usage
-----

Add this action to your repository by creating `.github/workflows/pr-template.yml`:

```yaml
name: PR Template Check
on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  check-template:
    runs-on: ubuntu-latest
    steps:
      - uses: rohitjmathew/pr-template-enforcer-action@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          required-sections: '["## Summary", "## Changes", "## Testing"]'
          jira-pattern: ^[A-Z]+-\d+
          skip-users: '["dependabot[bot]"]'
          skip-service-accounts: '["github-actions[bot]"]'
          label-name: needs-more-info

```

Configuration
-------------

### Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `github-token` | Yes | N/A | GitHub token used for API access. Must have permissions to read PRs and add labels |
| `required-sections` | No | `'["## Summary", "## Changes", "## Testing"]'` | JSON array of section headers that must be present in PR description |
| `jira-pattern` | No | `'^[A-Z]+-\\d+'` | Regular expression pattern to validate JIRA ticket references in PR title |
| `skip-users` | No | `'["dependabot[bot]", "github-actions[bot]"]'` | JSON array of GitHub usernames to skip validation |
| `skip-service-accounts` | No | `'["bot", "dependabot", "renovate", "github-actions"]'` | JSON array of substrings to identify service accounts to skip validation |
| `label-name` | No | `'needs-description'` | Name of the label to apply to non-compliant pull requests |
| `enforce-template` | No | `'true'` | Whether to enforce the repository PR template structure |
| `require-task-completion` | No | `'false'` | Whether to require at least one task list item to be completed in each section |

### Pull Request Template

When using the `enforce-template` input set to `true`, the action will look for a PR template in your repository and validate PR descriptions against it. This ensures contributors follow your project's standardized format.

Create a `.github/pull_request_template.md` file in your repository. Here's the template included with this project:

```markdown
## Summary
<!-- Provide a brief overview of your changes -->

## JIRA Ticket
<!-- Add your JIRA ticket reference here -->

## Type of Change
<!-- Select relevant options by adding [x] -->
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature with breaking changes)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactor
- [ ] Test update
- [ ] Build/CI change
- [ ] Other (please describe):

## Testing
<!-- Describe the tests you've added or modified -->
### Added/Modified Tests
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

### Test Instructions
<!-- How can others test your changes? -->

## Screenshots/Videos
<!-- If applicable, add screenshots or videos to help explain your changes -->

## Technical Details
<!-- Add any technical details that reviewers should know about -->
- Implementation approach:
- Dependencies added/removed:
- Database changes:
- API changes:

## Checklist
<!-- Mark completed items with [x] -->
- [ ] I have tested these changes locally
- [ ] I have updated the documentation
- [ ] I have added/updated tests
- [ ] I have checked for breaking changes
- [ ] My changes follow our coding standards
- [ ] I have considered security implications

## Additional Notes
<!-- Add any additional context or notes for reviewers -->
```

Template Structure Enforcement
------------------------------

When using `enforce-template: 'true'`, the action fetches your repository's PR template and validates the PR description against it. This ensures that:

1. All required sections from the template are present in the PR description
2. Sections aren't empty or containing placeholder text like "TODO" or "Fill this in"
3. The overall structure follows your team's standardized format

The action doesn't require that every section from the template be present, only those specified in the `required-sections` parameter. This allows for comprehensive templates with optional sections while only enforcing the critical ones.

For example, if your template has 8 sections but you only specify 3 in `required-sections`, contributors can omit the other 5 sections if they're not relevant to that particular PR.

When `enforce-template: 'false'`, the action falls back to a simpler check that just looks for the required section headings in the PR description without comparing against the template structure.

Task List Validation
--------------------

When using `require-task-completion: 'true'`, the action enforces that at least one task list item in each section is checked. This is useful for ensuring that contributors have completed necessary steps before submitting a PR.

For example, a checklist section:

```markdown
## Checklist
- [x] I have tested these changes locally
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
```

If this section has at least one item checked, it passes validation.

Examples
--------

### Recommended
This configuration provides comprehensive PR validation by:
- Ensuring required sections (`Summary`, `Changes`, `Testing`) are present and complete
- Validating that PR titles include a JIRA ticket in the format of `PROJECT-123`
- Skipping validation for automation bots like Dependabot and GitHub Actions
- Requiring contributors to check at least one task list item in each section (confirming they've completed necessary steps)
- Enforcing the repository's PR template structure
- Labeling non-compliant PRs with "needs-more-info" for easy identification

```yaml
- uses: rohitjmathew/pr-template-enforcer-action@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    required-sections: '["## Summary", "## Changes", "## Testing"]'
    jira-pattern: ^[A-Z]+-\d+
    skip-users: '["dependabot[bot]"]'
    skip-service-accounts: '["github-actions[bot]"]'
    require-task-completion: 'true'
    enforce-template: 'true'
    label-name: needs-more-info
```

### Basic Configuration

A minimal configuration that uses default settings to enforce basic PR template validation:

```yaml
- uses: rohitjmathew/pr-template-enforcer-action@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

When using this basic configuration, the action will:

- Check for required sections "Summary", "Changes", and "Testing"
- Validate JIRA ticket patterns in PR titles using the pattern [A-Z]+-\d+
- Skip validation for common bot accounts
- Apply the "needs-description" label to non-compliant PRs
- Enforce the repository's PR template structure
- Not require task list completion

### With JIRA Ticket Validation

This configuration validates that PR titles contain a JIRA ticket reference matching the specified pattern:

```yaml
- uses: rohitjmathew/pr-template-enforcer-action@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    jira-pattern: 'PROJ-\d+'
```

### With Custom Required Sections

This configuration specifies which sections must be present in all PR descriptions:

```yaml
- uses: rohitjmathew/pr-template-enforcer-action@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    required-sections: '["## Summary", "## Testing", "## Checklist"]'
```

### With Task List Enforcement

This configuration specifies which sections must be present in all PR descriptions:

```yaml
- uses: rohitjmathew/pr-template-enforcer-action@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    require-task-completion: 'true'
```

### With Template Enforcement Disabled

This configuration skips checking against your repository's PR template and simply verifies that the required sections are present:

```yaml
- uses: rohitjmathew/pr-template-enforcer-action@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    required-sections: '["## Summary", "## Testing"]'
    enforce-template: 'false'
```

### Skipping Service Accounts

This configuration exempts automated bot accounts from validation:

```yaml
- uses: rohitjmathew/pr-template-enforcer-action@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    skip-service-accounts: '["bot", "dependabot", "renovate", "github-actions"]'
```

Contributing
------------

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.
