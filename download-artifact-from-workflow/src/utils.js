var AdmZip = require('adm-zip');
const pathModule = require('path');
const fs = require('fs');
const core = require('@actions/core')

const downloadArtifact = async function (octokit, owner, repo, artifact, archiveFormat) {
    core.info(`Downloading ${owner}/${repo}/${artifact.id}/${archiveFormat}`)
    var downloadedArtifact = {}
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
                downloadedArtifact["FileName"] = contentDispositions.find(element => element.includes(filenameSearchPattern)).split("''")[1];
                downloadedArtifact["Data"] = response.data;
                downloadedArtifact["Name"] = artifact.name;
            }
        });
    return downloadedArtifact;
}

const saveArtifact = function (basePath, artifact) {
    const zipPath = pathModule.join(basePath, artifact["Name"])
    const zipFilePath = pathModule.join(zipPath, artifact["FileName"]);
    core.info(`Saving artifact ${artifact["FileName"]} to ${zipFilePath}`)

    if (!fs.existsSync(zipPath)) {
        fs.mkdirSync(zipPath, { recursive: true });
    }
    fs.writeFileSync(zipFilePath, Buffer.from(artifact["Data"]));

    return zipFilePath;
}

const extractArtifactTo = function (source) {
    var zip = new AdmZip(source);
    var targetPath = pathModule.dirname(source);

    core.info(`Extracting artifact ${source} to ${targetPath}`)
    zip.extractAllTo(targetPath, true);
};

exports.downloadArtifact = downloadArtifact;
exports.saveArtifact = saveArtifact;
exports.extractArtifactTo = extractArtifactTo;
