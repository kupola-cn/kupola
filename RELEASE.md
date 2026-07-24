# Release Strategy

## Versioning

Kupola follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (3.x.x): Breaking changes, incompatible API changes
- **MINOR** (x.1.x): New features, backward compatible
- **PATCH** (x.x.1): Bug fixes, backward compatible

---

## Release Types

### Stable Releases

Stable releases are published to npm with the `latest` dist-tag.

```bash
# Publish stable version
npm publish --access public --tag latest
```

### Beta Releases

Beta releases are for testing new features before they reach stable. They are published with the `beta` dist-tag.

```bash
# Publish beta version
npm publish --access public --tag beta
```

**When to use Beta:**
- New major/minor releases with significant changes
- Breaking API changes
- Major component overhauls

**Beta version format:**
- `3.1.0-beta.1`
- `3.1.0-beta.2`
- `3.1.0-rc.1` (release candidate)

### RC (Release Candidate) Releases

RC releases are for final testing before stable release. They are published with the `rc` dist-tag.

```bash
# Publish RC version
npm publish --access public --tag rc
```

**When to use RC:**
- After beta testing is complete
- No known critical bugs
- Ready for production use by early adopters

---

## Release Process

### 1. Pre-Release Checklist

- [ ] All tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint:directives`)
- [ ] Type checks pass (`npm run types:check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Size limits are within thresholds (`npm run size`)
- [ ] Documentation is updated
- [ ] Changelog is updated

### 2. Version Bumping

Use the `release.mjs` script to bump versions:

```bash
# Dry run to verify changes
node release.mjs --dry-run

# Perform actual release
node release.mjs
```

### 3. Beta/RC Release

For beta or RC releases, manually update the version with the appropriate suffix:

```json
{
  "version": "3.1.0-beta.1"
}
```

Then run the release script.

### 4. Stable Release

After beta/RC testing is complete, remove the prerelease suffix and publish as `latest`.

---

## API Deprecation Policy

### Deprecation Process

1. **Announcement**: Mark the API as deprecated in documentation and code comments
2. **Warning**: Add runtime warnings using `console.warn()` for deprecated APIs
3. **Grace Period**: Maintain backward compatibility for at least one minor version
4. **Removal**: Remove the deprecated API in the next major version

### Deprecation Warning Format

```javascript
// @deprecated Since v3.0.0. Use newApi() instead.
console.warn('[Kupola] oldApi() is deprecated. Use newApi() instead.');
```

### Deprecation Timeline

| Stage | Duration | Action |
|-------|----------|--------|
| Announcement | N/A | Mark as deprecated |
| Warning | 1 minor version | Add runtime warnings |
| Grace Period | 1-2 minor versions | Maintain backward compatibility |
| Removal | Next major version | Remove the API |

### Tracking Deprecations

Deprecated APIs are tracked in:
- Code comments with `@deprecated` JSDoc tag
- CHANGELOG.md with deprecation notices
- Documentation with deprecation warnings

---

## Changelog

Changelog entries follow the [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [3.1.0] - 2024-01-15

### Added
- New `lazyComponent()` API for code-splitting

### Changed
- Improved performance of `effect()` scheduler

### Deprecated
- `oldApi()` - Use `newApi()` instead

### Removed
- `removedApi()` - Removed in favor of `newApi()`

### Fixed
- Fixed memory leak in `signal()` cleanup
```

---

## Branch Management

- **main**: Main development branch
- **release/vX.Y**: Release preparation branches
- **hotfix/vX.Y.Z**: Urgent bug fix branches

---

## Support Policy

| Version | Status |
|---------|--------|
| Latest minor | Active support |
| Previous minor | Security fixes only |
| Older versions | No support |