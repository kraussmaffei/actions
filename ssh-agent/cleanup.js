const core = require('@actions/core')
const child_process = require('child_process')

try {
    // Kill the started SSH agent
    console.log('Stopping SSH agent')
    child_process.execSync('kill ${SSH_AGENT_PID}', { stdio: 'inherit' })
} catch (error) {
    console.log(error.message);
    console.log('Error stopping the SSH agent, proceeding anyway');
}