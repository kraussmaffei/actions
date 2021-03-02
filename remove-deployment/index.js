const core = require('@actions/core');
const github = require('@actions/github');
const { default: ForEach } = require('apr-for-each');


async function main() {
  const environment = core.getInput('environment', { required: true });

  const { context } = github;
  const { repo: repository } = context;
  const { repo, owner } = repository;

  const token = core.getInput('github-token');
  const octokit = github.getOctokit(token);

  // get deployemnts for this enviroment
  const { data: deployments } = await octokit.repos.listDeployments({owner, repo, environment});
  // for each deployment
  await ForEach(
    Array.prototype.concat.apply([], deployments),
    async ({ id: deployment_id }) => {
      // create an inactive status (so that we can remove the deployment)
      const req={
        owner,
        repo,
        deployment_id,
        state: 'inactive',
        headers: {
          "Accept": "application/vnd.github.flash-preview+json, application/vnd.github.ant-man-preview+json",
        }
      }
      await octokit.repos.createDeploymentStatus(req);

      // delete the deployment
      console.log('removeDeployment %o', { owner, repo, deployment_id });
      await octokit.repos.deleteDeployment({
        owner,
        repo,
        deployment_id,
      });
    },
  );
}

main().catch(function(error) {
  core.setFailed(error.message);
});