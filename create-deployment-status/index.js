const core = require('@actions/core');
const github = require('@actions/github');

async function main() {
    const {context} = github;
    const defaultUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;
    const token = core.getInput("github-token", {required: true});
    const url = core.getInput("target-url", {required: false}) || defaultUrl;
    const description = core.getInput("description", {required: false}) || "";
    const deploymentId = core.getInput("deployment-id", {required: true});
    const environmentUrl = core.getInput("environment-url", {required: false}) || "";
    const state = core.getInput("state", {required: true});
    const octokit = github.getOctokit(token, {previews: ["flash", "ant-man"]});


    const req = {
        owner: context.repo.owner,
        repo: context.repo.repo,
        deployment_id: deploymentId,
        state: state,
        log_url: defaultUrl,
        target_url: url,
        description: description,
        environment_url: environmentUrl
    }
    console.log('createDeploymentStatus %o', req);
    const resp = await octokit.repos.createDeploymentStatus(req);

}

main().catch(function (error) {
    core.setFailed(error.message);
});