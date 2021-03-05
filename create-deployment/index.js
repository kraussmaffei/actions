const core = require('@actions/core');
const github = require('@actions/github');

async function main() {
  const ref = core.getInput('ref') || github.context.ref || github.context.sha;
  const task = core.getInput('task', { required: true });
  const auto_merge = core.getInput('auto-merge') === 'true';
  const environment = core.getInput('environment', { required: true });
  const description = core.getInput('description');
  const transient_environment = core.getInput('transient-environment') === 'true';

  const default_production_environment = (environment === 'production').toString();
  const production_environment = (core.getInput('production-environment') || default_production_environment) === 'true';

  const { owner, repo } = github.context.repo;
  const req = {
    owner,
    repo,
    ref,
    task,
    auto_merge,
    environment,
    description,
    production_environment,
    transient_environment,
  };

  const payload = core.getInput('payload');
  if (payload) {
    req['payload'] = JSON.parse(payload);
  }

  const required_contexts = core.getInput('required-contexts');
  if (required_contexts !== '*') {
    if (required_contexts === '') {
      req['required_contexts'] = [];
    } else {
      req['required_contexts'] = required_contexts.split(',');
    }
  }

  const token = core.getInput('github-token');
  const octokit = github.getOctokit(token);

  console.log('createDeployment %o', req);
  const resp = await octokit.repos.createDeployment(req);

  if (resp.status >= 400) {
    throw new Error("Failed to create a new deployment");
  }

  core.setOutput('deployment-id', resp.data.id.toString());
  core.setOutput('deployment-url', resp.data.url);
  core.setOutput('statuses-url', resp.data.statuses_url);
}

main().catch(function(error) {
  core.setFailed(error.message);
});