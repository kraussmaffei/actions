import * as core from '@actions/core'
import { Commit } from '@octokit/webhooks-types'
import { checkCommitMessage, getCommits } from './commit'
import { summarizeWorkflow } from './summarize-workflow'

async function run(): Promise<void> {
  try {
    const accessToken = core.getInput('access-token', { required: true })

    const failOnError = JSON.parse(
      core.getInput('fail-on-error', { required: true })
    )
    const complianceRule: string = core
      .getInput('compliance-rule', { required: false })
      .toLowerCase()

    const commits = await getCommits(accessToken)

    switch (complianceRule) {
      case 'latest':
        {
          core.info(`Checking only the latest commit message for compliance.`)

          const sortedCommits: Commit[] = commits.sort(
            (firstItem, secondItem) =>
              +new Date(firstItem.timestamp) - +new Date(secondItem.timestamp)
          )
          const latestCommit = sortedCommits[sortedCommits.length - 1]

          summarizeWorkflow(
            async () => await checkCommitMessage(latestCommit?.message),
            failOnError
          )
        }
        break

      case 'at-least-once':
        {
          core.info(`Checking if at least one commit message is compliant.`)

          const result = commits.filter(
            async (commit: { message: string | undefined }) =>
              checkCommitMessage(commit.message)
          )
          summarizeWorkflow(async () => result.length > 0, failOnError)
        }
        break

      case 'all':
        {
          core.info(`Checking all commit messages for compliance.`)

          const result = commits.filter(
            async (commit: { message: string | undefined }) =>
              checkCommitMessage(commit.message)
          )
          summarizeWorkflow(
            async () => result.length === commits.length,
            failOnError
          )
        }
        break

      default:
        if (failOnError) {
          core.setFailed(
            `The provided compliance ${complianceRule} does not exist!`
          )
        }
        break
    }
  } catch (error) {
    core.error(error)
    core.setFailed(`An error occured when executing the action!`)
  }
}

run()
