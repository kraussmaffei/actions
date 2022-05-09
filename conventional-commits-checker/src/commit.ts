import { parser } from '@conventional-commits/parser'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { Commit, PullRequest, PushEvent } from '@octokit/webhooks-types'

export async function getCommits(accessToken: string): Promise<Commit[]> {
  let commits: Commit[] = []
  if (github.context.eventName === 'push') {
    core.debug(`Push event was triggered.`)
    core.debug(`The payload is ${JSON.stringify(github.context.payload)}.`)
    const pushEvent = github.context.payload as PushEvent
    core.debug(`Push event has ${pushEvent.commits.length} commits.`)
    commits = pushEvent.commits
  } else if (github.context.eventName === 'pull_request') {
    const pullRequest = github.context.payload.pull_request as PullRequest
    const octokit = github.getOctokit(accessToken)

    const pr_commits = await octokit.request(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}/commits',
      {
        owner: pullRequest.head.repo.owner.login,
        repo: pullRequest.head.repo.name,
        pull_number: pullRequest.number
      }
    )

    for (const commit of pr_commits.data) {
      commits.push(commit.commit as unknown as Commit)
    }
  }
  core.debug(`Returning ${commits.length} commits.`)
  return commits
}

export function checkCommitMessage(commitMessage: string | undefined): boolean {
  if (commitMessage === undefined) {
    return false
  }
  try {
    core.info(`Checking commit message: ${commitMessage}`)
    parser(commitMessage)
    core.info(`--> Commit message is compliant!`)
  } catch (error) {
    core.info(`--> Commit message is not compliant!`)
    return false
  }
  return true
}
