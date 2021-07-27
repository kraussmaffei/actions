# Conventional Commits Checker
This action uses the conventional commits parser from https://github.com/conventional-commits/parser to check commit messages to comply.

## Usage

```yaml
uses: kraussmaffei/conventional-commits-parser@main
with:
    access-token: ${{ secrets.GITHUB_TOKEN }}
    compliance-rule: "latest"
    fail-on-error: "false"
```

For further information see https://docs.github.com/en/actions/reference/authentication-in-a-workflow
