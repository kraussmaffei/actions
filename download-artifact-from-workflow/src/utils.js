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
    const zipPath = pathModule.join(basePath, artifact["Name"]);
    const zipPathAbsolute = pathModule.resolve(zipPath);
    const zipFilePath = pathModule.join(zipPath, artifact["FileName"]);
    const zipFilePathAbsolute = pathModule.resolve(zipFilePath);
    core.info(`Saving artifact ${artifact["FileName"]} to ${zipFilePathAbsolute}`);

    if (!fs.existsSync(zipPathAbsolute)) {
        fs.mkdirSync(zipPathAbsolute, { recursive: true });
    }
    fs.writeFileSync(zipFilePathAbsolute, Buffer.from(artifact["Data"]));

    return zipFilePathAbsolute;
}

const extractArtifactTo = function (source) {
    var sourceAbsolute = pathModule.resolve(source);
    var zip = new AdmZip(sourceAbsolute);
    var targetPathAbsolute = pathModule.dirname(sourceAbsolute);

    core.info(`Extracting artifact ${source} to ${targetPathAbsolute}`)
    zip.extractAllTo(targetPathAbsolute, true);
};

exports.downloadArtifact = downloadArtifact;
exports.saveArtifact = saveArtifact;
exports.extractArtifactTo = extractArtifactTo;
