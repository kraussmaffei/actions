const core = require('@actions/core');
const child_process = require('child_process');

/**
 * When the GitHub Actions job is done, clean up any environment variables that
 * may have been set by the configure-aws-credentials steps in the job.
 *
 * Environment variables are not intended to be shared across different jobs in
 * the same GitHub Actions workflow: GitHub Actions documentation states that
 * each job runs in a fresh instance.  However, doing our own cleanup will
 * give us additional assurance that these environment variables are not shared
 * with any other jobs.
 */

const DEFAULT_PROFILE = 'default';


async function cleanup() {
    try {
        // The GitHub Actions toolkit does not have an option to completely unset
        // environment variables, so we overwrite the current value with an empty
        // string. The AWS CLI and AWS SDKs will behave correctly: they treat an
        // empty string value as if the environment variable does not exist.
        core.exportVariable('AWS_ACCESS_KEY_ID', '');
        core.exportVariable('AWS_SECRET_ACCESS_KEY', '');
        core.exportVariable('AWS_SESSION_TOKEN', '');
        core.exportVariable('AWS_DEFAULT_REGION', '');
        core.exportVariable('AWS_REGION', '');

        // Configure Credentials
        const profile = core.getInput('aws-profile', {required: false}) || DEFAULT_PROFILE;

        child_process.execFileSync('aws', ['configure', '--profile', profile, 'set', 'aws_access_key_id', ''], {stdio: 'inherit'});
        child_process.execFileSync('aws', ['configure', '--profile', profile, 'set', 'aws_secret_access_key', ''], {stdio: 'inherit'});

        // Configure Session Token
        child_process.execFileSync('aws', ['configure', '--profile', profile, 'set', 'aws_session_token', ''], {stdio: 'inherit'});


    } catch (error) {
        core.setFailed(error.message);
    }
}

module.exports = cleanup;

/* istanbul ignore next */
if (require.main === module) {
    cleanup();
}