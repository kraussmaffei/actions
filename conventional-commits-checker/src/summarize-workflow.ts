import * as core from '@actions/core'

export function summarizeWorkflow(
  resultExpression: () => boolean,
  failOnError: boolean
): void {
  if (!resultExpression()) {
    if (failOnError) {
      core.setFailed(
        'Your commit message is not valid. You must comply with the conventional commits\n' +
          'The commit message must follow these rules https://python-semantic-release.readthedocs.io/en/latest/commit-log-parsing.html#commit-log-parsing\n' +
          '<type>(<scope>): <subject>\n' +
          '<BLANK LINE>\n' +
          '<body>\n' +
          '<BLANK LINE>\n' +
          '<footer>\n'
      )
    } else {
      core.warning(
        `Your PR title does not comply with conventional commits! Adjust this before you merge or the build on main will fail!\n` +
          'The commit message must follow these rules https://python-semantic-release.readthedocs.io/en/latest/commit-log-parsing.html#commit-log-parsing\n' +
          '<type>(<scope>): <subject>\n' +
          '<BLANK LINE>\n' +
          '<body>\n' +
          '<BLANK LINE>\n' +
          '<footer>\n'
      )
    }
  }
}
