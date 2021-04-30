const core = require('@actions/core');
const aws = require('aws-sdk');
const assert = require('assert');
const child_process = require('child_process');
const fs = require('fs')
const ini = require('ini')
const os = require('os')
const path = require('path');


// The max time that a GitHub action is allowed to run is 6 hours.
// That seems like a reasonable default to use if no role duration is defined.
const USER_AGENT = 'codeartifact-login-for-github-actions';
const DEFAULT_PROFILE = 'default';
const REGION_REGEX = /^[a-z0-9-]+$/g;


function getCodeartifactClient() {
    return new aws.CodeArtifact({
        customUserAgent: USER_AGENT
    });
}

async function getRepositoryEndpoint(params) {
    const {
        domain,
        domainOwner,
        repository,
        format
    } = params;
    assert(
        [domain, domainOwner, repository, format].every(isDefined),
        "Missing required input when getting repository endpoint."
    );

    const { GITHUB_REPOSITORY, GITHUB_WORKFLOW, GITHUB_ACTION, GITHUB_ACTOR, GITHUB_SHA } = process.env;
    assert(
        [GITHUB_REPOSITORY, GITHUB_WORKFLOW, GITHUB_ACTION, GITHUB_ACTOR, GITHUB_SHA].every(isDefined),
        'Missing required environment value. Are you running in GitHub Actions?'
    );

    const codeartifact = getCodeartifactClient();

    const getRepositoryEndpointRequest = {
        domain: domain,
        domainOwner: domainOwner,
        repository: repository,
        format: format
    };

    return codeartifact.getRepositoryEndpoint(getRepositoryEndpointRequest)
        .promise()
        .then(function (data) {
            return {
                repositoryEndpoint: data.repositoryEndpoint
            };
        });
}

async function getAuthorizationToken(params) {
    const {
        domain, domainOwner
    } = params;
    assert(
        [domain, domainOwner].every(isDefined),
        "Missing required input when getting authorization token."
    );

    const { GITHUB_REPOSITORY, GITHUB_WORKFLOW, GITHUB_ACTION, GITHUB_ACTOR, GITHUB_SHA } = process.env;
    assert(
        [GITHUB_REPOSITORY, GITHUB_WORKFLOW, GITHUB_ACTION, GITHUB_ACTOR, GITHUB_SHA].every(isDefined),
        'Missing required environment value. Are you running in GitHub Actions?'
    );

    const codeartifact = getCodeartifactClient();

    const getAuthorizationTokenRequest = {
        domain: domain,
        domainOwner: domainOwner
    };

    return codeartifact.getAuthorizationToken(getAuthorizationTokenRequest)
        .promise()
        .then(function (data) {
            return {
                authorizationToken: data.authorizationToken
            };
        });
}

function configurePoetry(params) {
    const {
        codeartifactRepository,
        codeartifactRepositoryUrl,
        codeartifactUser,
        codeartifactAuthToken
    } = params;
    assert(
        [codeartifactRepository, codeartifactRepositoryUrl, codeartifactUser, codeartifactAuthToken].every(isDefined),
        "Missing required input when configuring poetry."
    );

    // configure poetry with poetry config commands
    child_process.execFileSync('poetry', ['config', 'http-basic.' + codeartifactRepository, codeartifactUser, codeartifactAuthToken], { stdio: 'inherit' });
    child_process.execFileSync('poetry', ['config', 'repositories.' + codeartifactRepository, codeartifactRepositoryUrl], { stdio: 'inherit' });
    child_process.execFileSync('poetry', ['config', 'pypi-token.' + codeartifactRepository, codeartifactAuthToken], { stdio: 'inherit' });
}

function configurePip(params) {
    const {
        codeartifactRepository,
        codeartifactUser,
        codeartifactAuthToken,
        domain,
        domainOwner,
        region
    } = params;
    assert(
        [codeartifactRepository, codeartifactUser, codeartifactAuthToken, domain, domainOwner, region].every(isDefined),
        "Missing required input when configuring pip."
    );

    let indexUrl = `https://${codeartifactUser}:${codeartifactAuthToken}@${domain}-${domainOwner}.d.codeartifact.${region}.amazonaws.com/pypi/${codeartifactRepository}/simple/`;

    // configure pip extra index url with pip config command
    child_process.execFileSync('pip', ['config', 'set', 'global.extra-index-url', indexUrl], { stdio: 'inherit' });
}

function configureTwine(params) {
    const {
        codeartifactRepository,
        codeartifactUser,
        codeartifactAuthToken,
        domain,
        domainOwner,
        region,
        iniFile = path.join(os.homedir(), '.pypirc')
    } = params;
    assert(
        [codeartifactRepository, codeartifactUser, codeartifactAuthToken, domain, domainOwner, region].every(isDefined),
        "Missing required input when configuring twine."
    );

    let codeartifactRepositoryUrl = `https://${codeartifactUser}:${codeartifactAuthToken}@${domain}-${domainOwner}.d.codeartifact.${region}.amazonaws.com/pypi/${codeartifactRepository}/simple/`;

    // configure twine with editing its ini file
    configureTwineIniFile({
        'iniFile': iniFile,
        'codeartifactRepository': codeartifactRepository,
        'codeartifactRepositoryUrl': codeartifactRepositoryUrl,
        'codeartifactUser': codeartifactUser,
        'codeartifactAuthToken': codeartifactAuthToken
    });
}

function configureTwineIniFile(params) {
    const {
        iniFile,
        codeartifactRepository,
        codeartifactRepositoryUrl,
        codeartifactUser,
        codeartifactAuthToken
    } = params;
    assert(
        [iniFile, codeartifactRepository, codeartifactRepositoryUrl, codeartifactUser, codeartifactAuthToken].every(isDefined),
        "Missing required input when configuring twine ini file."
    );

    var config;
    fs.accessSync("somefile", error => {
        if (!error) {
            config = ini.parse(fs.readFileSync(iniFile, 'utf-8'));
        } else {
            config = {};
        }
    });

    config.repository = codeartifactRepositoryUrl;
    config.username = codeartifactUser;
    config.password = codeartifactAuthToken;

    fs.writeFileSync(iniFile, ini.stringify(config, { section: codeartifactRepository }));
}

function setOutputs(params) {
    const {
        codeartifactRepositoryUrl,
        codeartifactAuthToken,
        codeartifactUser
    } = params;
    assert(
        [codeartifactRepositoryUrl, codeartifactAuthToken, codeartifactUser].every(isDefined),
        "Missing required input when configuring twine ini file."
    );

    core.setOutput('codeartifact-repository-url', codeartifactRepositoryUrl);
    core.setOutput('codeartifact-auth-token', codeartifactAuthToken);
    core.setOutput('codeartifact-user', codeartifactUser);
}

async function run() {
    try {
        // Get inputs
        const repositoryName = core.getInput('repository-name', { required: true });
        const domainName = core.getInput('domain-name', { required: true });
        const domainOwner = core.getInput('domain-owner', { required: true });
        const region = core.getInput('region', { required: true });

        if (region) {
            if (!region.match(REGION_REGEX)) {
                throw new Error(`Region is not valid: ${region}`);
            }
        }


        // TODO get endpoints and tokens
        // TODO configure Tools
        // TODO set outputs and return
        // TODO write test.yml and test with act
        // TODO only execute configure functions when the tool exists

    } catch (error) {
        core.setFailed(error.message);

        const showStackTrace = process.env.SHOW_STACK_TRACE;

        if (showStackTrace === 'true') {
            throw (error)
        }

    }
}

module.exports = run;

/* istanbul ignore next */
if (require.main === module) {
    run();
}