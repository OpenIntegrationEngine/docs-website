---
title: Contributing
description: How to propose a change to this documentation, and how to contribute to the engine itself
---

# Contributing to Open Integration Engine

Thank you for your interest in contributing. There are two separate paths, and
most people want the first one.

## Contributing to this documentation

The documentation lives in its own repository,
[openintegrationengine/docs-website](https://github.com/OpenIntegrationEngine/docs-website),
separate from the engine. Every page on this site is a Markdown file under
`docs/`. There are two ways to suggest a change.

### Report it in an issue

If something is wrong, missing or unclear,
[open an issue](https://github.com/OpenIntegrationEngine/docs-website/issues)
on the documentation repository. Say which page, what it says, and what it
should say if you know. All you need is a GitHub account.

### Change it yourself in a pull request

For a small change, use the **Edit this page on GitHub** link at the bottom of
the page. GitHub opens the file in its editor, makes a copy of the repository
for you, and takes you to the pull request.

For anything larger, work on a copy of the site:

1. Fork [openintegrationengine/docs-website](https://github.com/OpenIntegrationEngine/docs-website) and clone your fork.
2. Install the tooling and start the site locally:
   ```bash
   bun install
   bun run docs:dev
   ```
   The site serves at `http://localhost:5173/` and reloads as you edit.
3. Edit the Markdown under `docs/`. The page you are reading is
   `docs/engine/contributing.md`, and the other pages follow the same pattern.
4. Run `bun run docs:build` before you push. The build fails on dead links, so
   this catches the most common mistake. The build warns that some chunks are
   larger than 500 kB. That is the search index, and it is expected.
5. Open a pull request against `main` with a short description of what changed
   and why.

**One thing worth knowing before you edit a code sample.** The samples on this
site are checked against the engine source, not written from memory, because a
sample that runs without error can still be wrong: it can log per message, leak
a database connection on the failure path, or use a properties key the engine
never reads. If you change a sample, say in the pull request how you verified
it, and prefer citing the engine source over describing the intent.

**Which release the pages describe.** The pages were last checked against OIE
4.7.0. When a new release ships, compare its tag with the previous one in the
engine repository, recheck the pages that cover what changed, and update the
version in this paragraph.

## Contributing to the engine

Thank you for your interest in contributing to the **Open Integration Engine** project. Contributions are vital to the continued growth and success of the project, and we welcome all forms of participation, whether you are a developer, a documentation contributor, or a user providing feedback.

The contribution process is straightforward and can be completed in a few simple steps:

## How to contribute

### 1. Open an issue
Before making any changes, please open an issue in the [GitHub Issues Tracker](https://github.com/OpenIntegrationEngine/engine/issues). This step helps us discuss the problem or feature before work begins, ensuring alignment and reducing redundant efforts.

### 2. Fork the repository
Start by forking the [Open Integration Engine GitHub repository](https://github.com/OpenIntegrationEngine/engine) to your own GitHub account.

### 3. Clone your fork
Clone your fork locally to your development environment:
```bash
git clone git@github.com:your-github/engine.git
```

### 4. Make changes
Create a new branch for your feature or bug fix:
```bash
git checkout -b feature/your-feature-name
```

### 5. Install tooling
OIE specifies the working Java version in [`.sdkmanrc`](https://github.com/OpenIntegrationEngine/engine/blob/main/.sdkmanrc). To take advantage of this, install [SDKMAN](https://sdkman.io/) and run `sdk env install`
in the project's root directory.

### 6. Implement your changes

Implement the necessary changes, ensuring they align with the project's coding standards and practices.

### 7. Test your changes
Before submitting your changes, please ensure that all tests pass and that your changes work as expected in your local environment. The build and test commands are kept in the engine repository's [CONTRIBUTING.md](https://github.com/OpenIntegrationEngine/engine/blob/main/CONTRIBUTING.md).

### 8. Submit a pull request
Once your changes are ready, push them to your fork and create a **draft pull request (PR)** from your branch to the `main` branch of the project. Draft PRs help indicate that the work is in progress.
Mark the PR as **"Ready for review"** only when it is actually complete and ready for feedback. Include a brief description of the changes and reference the related issue.

## Reporting bugs

If you encounter a bug, please report it using the **GitHub Issues Tracker**:
1. **Search for existing issues** to check if the problem has already been reported.
2. If the issue is not listed, create a new issue with the following information:
   - A clear and descriptive title.
   - Steps to reproduce the issue.
   - The expected vs. actual behavior.
   - Any relevant logs, error messages, or screenshots to help diagnose the issue.

## Suggesting features

If you would like to suggest a new feature or enhancement:
1. Open a new issue in the **GitHub Issues Tracker**.
2. Use the **Feature request** template, which applies the `enhancement` label.
3. Provide a detailed description of the feature and the problem it aims to solve.
4. If applicable, include examples or use cases to demonstrate the value of the feature.

## Community guidelines

- Be respectful and professional in all interactions.
- Provide constructive feedback and suggestions.
- Engage in discussions around pull requests and issues with an open and collaborative mindset.

## License

By contributing to **Open Integration Engine**, you agree that your contributions will be licensed under the [Mozilla Public License (MPL) 2.0](https://github.com/OpenIntegrationEngine/engine/blob/main/LICENSE).

Thank you for your interest in improving **Open Integration Engine**.
