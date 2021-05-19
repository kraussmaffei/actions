const core = require('@actions/core');
const github = require('@actions/github');
const pathModule = require('path');
const { downloadArtifact, saveArtifact, extractArtifactTo } = require('./utils');

async function downloadAndExtractArtifact(octokit, owner, repo, artifact, archiveFormat, workspace, path) {
  // Download the given artifact name
  var downloadedArtifact = await downloadArtifact(octokit, owner, repo, artifact, archiveFormat);

  // Save artifact to designated location
  var basePath = pathModule.join(workspace, path);
  var artifactFilePath = saveArtifact(basePath, downloadedArtifact);

  extractArtifactTo(artifactFilePath);
}

// most @actions toolkit packages have async methods
async function run() {
  try {
    var workflowRunId;
    var artifactName;
    var path;
    var artifacts;
    var workspace;
    var owner;
    var repo;
    var archiveFormat;
    var githubToken;

    if (github.context.workflow) {
      // get inputs - running in a workflow
      core.debug('Fetching input variables')
      workflowRunId = core.getInput("workflow-run-id", { required: true });
      artifactName = core.getInput("artifact-name", { required: false });
      archiveFormat = core.getInput("archive-format", { required: false })
      path = core.getInput("path", { required: false }) || "";
      githubToken = core.getInput("github-token", { required: true });
      core.debug(`Workflowrun Id: ${workflowRunId}`)
      core.debug(`Archive Format: ${archiveFormat}`)
      core.debug(`Path: ${path}`)

      // set variables
      core.debug('Setting context variables')
      owner = github.context.repo.owner;
      repo = github.context.repo.repo;
      
      core.debug(`Owner: ${owner}`)
      core.debug(`Repo: ${repo}`)
      core.debug(`Workspace: ${workspace}`)
    }
    else {
      // get env variables - running locally on dev machine
      workflowRunId = process.env["workflow-run-id"];
      artifactName = process.env["artifact-name"];
      owner = process.env["owner"];
      repo = process.env["repo"];
      archiveFormat = process.env["archive-format"]
      workspace = process.cwd();
      path = "/my-path";
      githubToken = process.env["github-token"];
    }
    workspace = process.env["GITHUB_WORKSPACE"];

    core.debug('Setting up octokit')
    const octokit = github.getOctokit(githubToken);

    try {
      // List all artifacts of given workflow run
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

    if (artifacts.data.total_count === 0) {
      core.warning("No artifacts found!")
      return;
    }
    else {
      core.debug(`Found ${artifacts.data.total_count} artifacts.`)
    }

    if (artifactName) {
      // Download artifact
      let artifact = artifacts.data.artifacts.find(element => element.name === artifactName);
      await downloadAndExtractArtifact(octokit, owner, repo, artifact, archiveFormat, workspace, path)
    }
    else {
      // Download all artifacts
      await Promise.all(artifacts.data.artifacts.map(async (artifact) => {
        await downloadAndExtractArtifact(octokit, owner, repo, artifact, archiveFormat, workspace, path)
      }));
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
