# Download-Artifact-From-Workflow

This downloads artifacts from a given workflow id.

# Usage

See [action.yml](action.yml)

# Download a Single Artifact

Basic (download to the current working directory):
```yaml
steps:
- uses: kraussmaffei/actions/download-artifact-from-workflow@main
  with:
    workflow-run-id: ${{ github.event.deployment.payload.workflow-run-id }}
    artifact-name: your-artifact-name

- name: Display structure of downloaded files
  run: ls -R
```

Download to a specific directory:
```yaml
steps:
- uses: kraussmaffei/actions/download-artifact-from-workflow@main
  with:
    workflow-run-id: ${{ github.event.deployment.payload.workflow-run-id }}
    artifact-name: your-artifact-name
    path: /path/to/artifact

- name: Display structure of downloaded files
  run: ls -R
  working-directory: path/to/artifact
```

# Download All Artifacts

Download all artifacts to the current directory:
```yaml
steps:
- uses: kraussmaffei/actions/download-artifact-from-workflow@main
  with:
    workflow-run-id: ${{ github.event.deployment.payload.workflow-run-id }}

- name: Display structure of downloaded files
  run: ls -R
```

Download all artifacts to a specific directory:
```yaml
steps:
- uses: kraussmaffei/actions/download-artifact-from-workflow@main
  with:
    workflow-run-id: ${{ github.event.deployment.payload.workflow-run-id }}
    path: /path/to/artifact

- name: Display structure of downloaded files
  run: ls -R
  working-directory: path/to/artifact
```