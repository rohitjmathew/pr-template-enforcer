import * as github from '@actions/github';

/**
 * Creates a mock Octokit instance for testing
 * @returns Mocked Octokit instance
 */
export function createMockOctokit() {
  return {
    rest: {
      issues: {
        createComment: jest.fn().mockResolvedValue({}),
        addLabels: jest.fn().mockResolvedValue({}),
        removeLabel: jest.fn().mockResolvedValue({})
      },
      pulls: {
        get: jest.fn().mockResolvedValue({
          data: { head: { sha: 'test-sha' } }
        })
      },
      repos: {
        getContent: jest.fn()
      },
      checks: {
        create: jest.fn().mockResolvedValue({})
      }
    }
  };
}

/**
 * Sets up the GitHub context for testing
 * @param options Configuration options
 */
export function setupGitHubContext(options: {
  eventName?: string;
  owner?: string;
  repo?: string;
  prNumber?: number;
  prBody?: string;
  prTitle?: string;
  userLogin?: string;
}) {
  const {
    eventName = 'pull_request',
    owner = 'test-owner',
    repo = 'test-repo',
    prNumber = 123,
    prBody = '## Test\nThis is a test PR',
    prTitle = 'TEST-123: Test PR',
    userLogin = 'testuser'
  } = options;

  (github.context as any) = {
    eventName,
    repo: {
      owner,
      repo
    },
    payload: {
      pull_request: {
        number: prNumber,
        body: prBody,
        title: prTitle,
        user: {
          login: userLogin
        }
      }
    }
  };
}