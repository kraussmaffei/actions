const core = require('@actions/core');
const github = require('@actions/github');

async function main() {
  const ref = core.getInput('ref') || github.context.ref || github.context.sha;
  const workflow_id = core.getInput('workflow-id', { required: true });

  const { owner, repo } = github.context.repo;
  const req = {
    owner,
    repo,
    ref,
    workflow_id
  };

  const inputs = core.getInput('inputs');
  if (inputs) {
    req['inputs'] = JSON.parse(inputs);
  }

  const token = core.getInput('github-token');
  const octokit = github.getOctokit(token);

  console.log('createWorkflowDispatch %o', req);
  const resp = await octokit.rest.actions.createWorkflowDispatch(req);

  if (resp.status >= 400) {
    throw new Error("Failed to create a new workflow dispatch");
  }

}

main().catch(function(error) {
  core.setFailed(error.message);
});