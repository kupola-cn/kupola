# Contributing to Kupola

Thank you for your interest in contributing to Kupola! We welcome contributions of all kinds.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/kupola.git
   cd kupola
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development

```bash
# Start dev server (hot reload)
npm run dev

# Production build
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

## What We're Looking For

- **Bug fixes** — with test cases when possible
- **New components** — following the existing component patterns
- **Documentation improvements** — typos, clarity, examples
- **Performance optimizations** — measurable improvements welcome
- **Accessibility** — WCAG AA compliance is a hard requirement
- **HTTP client adapters** — support for popular HTTP libraries

## Component Guidelines

- Components use `data-*` attributes for declarative initialization
- All components must register with `window.kupolaInitializer`
- CSS classes follow the `ds-` prefix convention (e.g., `ds-card`, `ds-btn`)
- Components must work without JavaScript for basic display (progressive enhancement)
- Dark theme must be the default; light theme as an alternative

## Code Style

- Use ES modules (`import`/`export`)
- Follow existing naming conventions (camelCase for JS, kebab-case for CSS/HTML)
- Add JSDoc comments for public APIs
- Keep functions small and focused
- No external dependencies in core modules

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new datepicker component
fix: resolve modal z-index issue
docs: update usage guide with examples
perf: optimize virtual list rendering
style: format code with prettier
```

## Pull Request Process

1. Ensure your code passes `npm run lint` and `npm run build`
2. Update documentation if you change public APIs
3. Add a description of what your PR does
4. Link any related issues

## Reporting Issues

- Use [GitHub Issues](https://github.com/kupola-cn/kupola/issues)
- Include a minimal reproduction case
- Mention your browser version and OS
- For UI issues, a screenshot or codepen is helpful

## Questions?

Open a [GitHub Discussion](https://github.com/kupola-cn/kupola/discussions) or tag your question with `question` in an issue.

---

Thank you for helping make Kupola better!
