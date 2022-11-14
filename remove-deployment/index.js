const core = require('@actions/core');
const github = require('@actions/github');
const {default: ForEach} = require('apr-for-each');


async function main() {
    const environment = core.getInput('environment', {required: true});

    const {context} = github;
    const {repo: repository} = context;
    const {repo, owner} = repository;

    const token = core.getInput('github-token');
    const octokit = github.getOctokit(token, {previews: ["flash", "ant-man"]});

    // get deployemnts for this enviroment
    const {data: deployments} = await octokit.rest.repos.listDeployments({owner, repo, environment});
    // for each deployment
    await ForEach(
        Array.prototype.concat.apply([], deployments),
        async ({id: deployment_id}) => {
            // create an inactive status (so that we can remove the deployment)
            let req = {owner, repo, deployment_id, state: 'inactive'}
            console.log('createDeploymentStatus %o', req);
            await octokit.rest.repos.createDeploymentStatus(req);

            // delete the deployment
            req = {owner, repo, deployment_id}
            console.log('deleteDeployment %o', req);
            await octokit.rest.repos.deleteDeployment(req);
        },
    );
}

main().catch(function (error) {
    core.setFailed(error.message);
});