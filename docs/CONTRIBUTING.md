# Contributing to Resilience Atlas

Thank you for your interest in contributing! 🎉  
Please read these guidelines before opening a pull request.

---

## Code of Conduct

Be respectful and inclusive. Harassment of any kind will not be tolerated.

---

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/resilience-atlas.git
   cd resilience-atlas
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Configure** your `.env` (see [docs/SETUP.md](SETUP.md))
5. **Create a branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

---

## Development Workflow

```bash
npm run dev   # start dev server with auto-reload
npm test      # run tests
```

---

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Write clear commit messages in the imperative mood (`Add feature`, not `Added feature`)
- Include tests for new functionality where applicable
- Ensure all existing tests pass before submitting
- Reference any related issues with `Closes #<issue-number>`

---

## Reporting Issues

Use the [GitHub Issues](https://github.com/Abafirst/resilience-atlas/issues) tracker.  
Include:
- A clear title and description
- Steps to reproduce the issue
- Expected vs actual behaviour
- Relevant logs or screenshots

---

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `backend/` | Express API (routes, middleware, models, services) |
| `frontend/` | HTML and client-side JS |
| `integrations/` | OpenClaw and other third-party integrations |
| `docs/` | Project documentation |
| `config/` | Environment and deployment configuration |

---

## Style Guide

- Use `const`/`let` — no `var`
- Use `async/await` over raw Promise chains
- Keep functions small and single-purpose
- Log with the `logger` utility (`backend/utils/logger.js`), not `console.log`
- Validate all user input before processing

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
