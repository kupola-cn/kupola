# Releasing

This project uses [standard-version](https://github.com/conventional-changelog/standard-version)
for version bumps and changelog generation, and publishes to npm from the
`publish` job in [.github/workflows/ci.yml](.github/workflows/ci.yml), which
only runs when a `v*` tag is pushed.

## Before you start

- `npm run verify` must pass locally (lint, types, tests, build, size, knip).
- You need push access to `kupola-cn/kupola` and the `NPM_TOKEN` secret must be
  configured in the repository so the publish job can authenticate to npm.
- The repo ruleset blocks direct pushes to `main` (PR required, verified
  signatures). Version-bump commits therefore go through a pull request; the
  tag is pushed directly (tags are not covered by the branch ruleset).

## Release steps

1. **Dry run** to preview the bump:

   ```sh
   npm run release:dry
   ```

   Use `release:patch`, `release:minor`, `release:major`, `release:beta`, or
   `release:rc` instead of `release` when you want a specific increment.

2. **Bump version and update the changelog**:

   ```sh
   npm run release
   ```

   This updates `package.json`, `package-lock.json`, `version.json`, and
   `CHANGELOG.md`, creates a signed release commit, and creates a signed
   `vX.Y.Z` tag (git signing is configured via `commit.gpgsign`).

3. **Push the version bump commit through a PR** (required by the ruleset):

   ```sh
   git push origin main:release/vX.Y.Z
   gh pr create --title "chore(release): vX.Y.Z"
   gh pr merge --merge
   ```

4. **Push the tag to publish**:

   ```sh
   git push origin vX.Y.Z
   ```

   CI runs the full gate on the tag and the `publish` job runs
   `npm publish --access public --tag latest --provenance`.

5. **Verify** the published package:

   ```sh
   npm view @kupola/kupola@vX.Y.Z version
   ```

   The GitHub release page will show the tag; add release notes from
   `CHANGELOG.md` if desired.

## Notes

- The release commit and tag are signed with the repository's SSH signing key,
  so they satisfy the ruleset's verified-signature requirement.
- The publish job requires `NPM_TOKEN`; without it the tag CI run will fail at
  the publish step (the rest of the gate still runs).
- Keep `version.json` in sync — `npm run release:metadata` (part of verify)
  fails if `package.json`, the lockfile, `version.json`, and `CHANGELOG.md`
  disagree.
