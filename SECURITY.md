# Security Policy

## Supported versions

Security fixes are provided for the latest published `3.x.x` release. Older
minor and prerelease versions should be upgraded before reporting a problem.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private
vulnerability reporting flow from the repository Security tab:

https://github.com/kupola-cn/kupola/security/advisories/new

Include the affected version, a minimal reproduction, expected impact, and any
known mitigations. Maintainers will acknowledge the report, validate the issue,
and coordinate disclosure and a patched release before public discussion.

Kupola directive expressions are intended for trusted application templates.
Reports that rely only on placing attacker-controlled JavaScript expressions in
a trusted template are outside the supported threat model; sanitizer, URL, CSP,
or lifecycle bypasses within the documented model are in scope.
