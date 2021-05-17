const core = require('@actions/core');
const github = require('@actions/github');
const pathModule = require('path');
const fs = require('fs');

// most @actions toolkit packages have async methods
async function run() {
  try {
    var workflowRunId;
    var githubToken;
    var path;
    var artifacts;
    var workspace;

    if (github.context.workflow) {
      // get inputs - running in a workflow
      core.debug('Fetching input variables')
      workflowRunId = core.getInput("workflow-run-id", { required: true });
      archiveFormat = core.getInput("archive-format", { required: false })
      githubToken = core.getInput("github-token", { required: false });
      path = core.getInput("path", { required: false }) || "";
      core.debug(`Workflowrun Id: ${workflowRunId}`)
      core.debug(`Archive Format: ${archiveFormat}`)
      core.debug(`Github Token: ${githubToken}`)
      core.debug(`Path: ${path}`)

      // set variables
      core.debug('Setting context variables')
      owner = github.context.repo.owner;
      repo = github.context.repo.repo;
      workspace = github.context.workspace || "~";

      core.debug(`Owner: ${owner}`)
      core.debug(`Repo: ${repo}`)
      core.debug(`Workspace: ${workspace}`)

    }
    else {
      // get env variables - running locally on dev machine
      workflowRunId = process.env["workflow-run-id"];
      owner = process.env["owner"];
      repo = process.env["repo"];
      archiveFormat = process.env["archive-format"]
      githubToken = process.env["github-token"];
      workspace = process.cwd();
      path = "";
    }

    core.debug('Setting up octokit')
    const octokit = github.getOctokit(githubToken);

    try {
      // Get artifacts
      core.info(`Trying to get artifacts of /repos/${owner}/${repo}/actions/runs/${workflowRunId}/artifacts`)
      artifacts = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts', {
        owner: owner,
        repo: repo,
        run_id: workflowRunId
      })
    } catch (error) {
      core.warning(`There are no artifacts available.`);
      return;
    }

    core.debug(`Found ${artifacts.data.artifacts.length}`)
    // Dowload and save artifacts
    await Promise.all(artifacts.data.artifacts.map(async (artifact) => {
      core.info(`Downloading ${owner}/${repo}/${artifact.id}/${archiveFormat}`)
      await octokit.request('GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}', {
        owner: owner,
        repo: repo,
        artifact_id: artifact.id,
        archive_format: archiveFormat
      })
        .then((response) => {
          if (response.status === 200) {
            const filenameSearchPattern = "filename*=UTF-8";

            const contentDispositions = response.headers['content-disposition'].split('; ');
            const filename = contentDispositions.find(element => element.includes(filenameSearchPattern)).split("''")[1];
            const filepath = pathModule.join(workspace, path, filename);
            core.info(`Saving artifact ${filename} to ${filepath}`)
            fs.writeFileSync(filename, Buffer.from(response.data));
          }
        });
    }));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
