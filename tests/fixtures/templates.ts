/**
 * Collection of template fixtures for testing
 */

export const templates = {
  // Valid PR description with all required sections
  valid: {
    description: `
## Description
This is a valid pull request description.

## Changes
- Added new feature
- Fixed bugs
`,
    title: '[JIRA-123] Implement new feature'
  },

  missing: {
    description: `
This description is missing required sections.
`,
    title: 'Implement new feature'
  },

  placeholder: {
    description: `
## Description
TODO

## Changes
Fill this in
`,
    title: '[JIRA-123] Implement new feature'
  },

  custom: {
    description: `
## Summary
Fixed bug in authentication flow.

## Testing
Tested with unit tests and manual verification.
`,
    title: 'ABC-123: Custom format'
  },

  withComments: {
    description: `
## Description
<!-- This section should describe what the PR does -->
This is a valid pull request description.

## Changes
<!-- List the changes made in this PR -->
- Added new feature
- Fixed bugs
`,
    title: '[JIRA-456] Feature with comments'
  },

  missingSection: {
    template: `
## Summary
Provide a brief overview of what this PR does.

## Changes
List the changes made in this PR.

## Testing
Describe how this PR was tested.
`,
    description: `
## Summary
Fixed bug in authentication flow.

## Changes
- Updated login controller
- Fixed error handling
`
  },

  emptySection: {
    template: '## Testing\nDescribe your tests here',
    description: '## Testing\n'  // Make sure it's truly empty
  },

  unmodifiedTemplate: {
    template: '## Summary\nProvide a brief description of the changes',
    description: '## Summary\nProvide a brief description of the changes'  // Identical to template
  },

  fillThisIn: {
    template: `
## Description
Describe the changes.
`,
    description: `
## Description
Fill this in
`
  },

  withOptionalSections: {
    template: `
## Summary
Summary information.

## Optional Section
Optional information.

## Testing
Testing information.
`,
    description: `
## Summary
This is the summary.

## Testing
These are the tests.
`
  },

  caseInsensitive: {
    template: `
## Summary
Summary info.
`,
    description: `
## summary
This is the summary with lowercase heading.
`
  },

  partialMatch: {
    template: `
## Summary of Changes
Summary info.
`,
    description: `
## Summary of Changes
This is the summary.
`
  },

  minimalContent: {
    template: `
## Summary
Provide a brief summary of your changes

## Details
Provide detailed information

## Testing
Explain how you tested these changes
`,
    description: `
## Summary
-

## Details
This section has valid content.

## Testing
   
`
  },

  markdownWithComments: `## Section 1
<!-- This is a comment -->
Content

## Section 2
More content<!-- Another comment -->`,

  withTaskLists: {
    template: `
## Checklist
- [ ] I have tested these changes locally
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
`,
    description: {
      complete: `
## Checklist
- [x] I have tested these changes locally
- [x] I have updated the documentation accordingly
- [x] My changes generate no new warnings
`,
      incomplete: `
## Checklist
- [x] I have tested these changes locally
- [ ] I have updated the documentation accordingly
- [x] My changes generate no new warnings
`,
      noneChecked: `
## Checklist
- [ ] I have tested these changes locally
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
`,
      missing: `
## Checklist
This PR is ready for review.
`
    }
  },

  uncheckedTasks: {
    template: '## Checklist\n- [ ] Task 1\n- [ ] Task 2',
    description: '## Checklist\n- [ ] Task 1\n- [ ] Task 2'  // No tasks checked
  },

  // Add templates for branch coverage tests
  branchCoverage: {
    emptyContent: {
      template: `
## Test
Some template content
`,
      description: `
## Test
`
    },
    taskItems: {
      template: `
## Checklist
- [ ] Task 1
- [ ] Task 2
`,
      description: `
## Checklist
Some content without task items
`
    },
    malformedMarkdown: `
## Section with * special [ characters ] that might (cause) regex /issues/
Content
`
  },

  // Update or create this fixture
  compliantPR: {
    template: '## Description\nProvide a description of the changes\n\n## Changes\nList all changes made',
    description: '## Description\nThis is a valid description that is completely different from the template text.\n\n## Changes\nThese are valid changes that pass validation and are not similar to the template.'
  }
};

export const jiraFormats = {
  standard: '[JIRA-123] Implement new feature',
  noPrefix: 'JIRA-123 Implement new feature',
  withColon: 'JIRA-123: Implement new feature',
  custom: 'ABC-123: Custom format',
  invalid: 'Implement new feature'
};

export const requiredSectionSets = {
  standard: ['## Description', '## Changes'],
  custom: ['## Summary', '## Testing'],
  mixedCase: ['Summary', 'Changes', 'Testing'],
  singleSection: ['Test'],
  checklistOnly: ['Checklist']
};

export const templateResponses = {
  prTemplate: '# PR Template',
  rootPrTemplate: '# Root PR Template'
};