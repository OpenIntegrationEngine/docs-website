# Open Integration Engine™ Documentation

Welcome to the official documentation repository for **Open Integration Engine™**. This website is built with [VitePress](https://vitepress.dev/) and hosted on GitHub Pages.

We welcome contributions from the community! Whether you are fixing a typo, adding a new guide, or sharing a script example, your help is appreciated.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Writing Guidelines](#writing-guidelines)
- [Legal & Licensing](#legal--licensing)

## Getting Started

### Prerequisites

- **Bun**: This project uses Bun for dependency management and as the runtime. [Install Bun](https://bun.sh/).

### Installation

1. **Fork the repository** to your own GitHub account.

2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/docs-website.git
   cd docs-website
   ```

3. **Install dependencies**:

   ```bash
   bun install
   ```

### Running Locally

To start the local development server with hot-reloading:

```bash
bun run docs:dev
```

The documentation will be accessible at `http://localhost:5173` (or the port shown in your terminal).

## Development Workflow

1. **Create a Branch:** Always work on a new branch for your changes.

   ```bash
   git checkout -b fix/typo-in-intro
   ```

2. **Make Changes:** Edit the Markdown files in the `docs` directory.

3. **Update Navigation:** If you created a new file, update `.vitepress/config.mts` to include the new page in the sidebar.

4. **Preview:** Ensure your changes look correct in the local browser preview.

5. **Commit:** [Sign off](#developer-certificate-of-origin-dco) your commits.

   ```bash
   git commit -s -m "docs: fix typo in introduction"
   ```

6. **Push:** Push your branch to your fork.

7. **Pull Request:** Open a Pull Request (PR) against the `main` branch of this repository.

## Writing Guidelines

* **Markdown Features:** We use [VitePress Markdown](https://vitepress.dev/guide/markdown). This supports standard Markdown as well as advanced features like custom containers, Vue components inside markdown, and more.
* **Code Blocks:** Please use language-specific code fences (e.g., \`\`\`js) for syntax highlighting.
* **Images:** You can store images in the same directory as the markdown file or in the `docs/public` directory. Reference them using relative paths.

## Legal & Licensing

To maintain the open and permissive nature of this documentation, we require all contributors to agree to the project's licensing terms and verify the origin of their contributions.

### 1. Inbound License Agreement

By submitting a Pull Request to this repository, you agree to the following licensing terms:

* **Documentation Content (Text/Media):** You agree to license your text and media contributions under the **Creative Commons Attribution 4.0 International (CC-BY 4.0)** license.
* **New Code Samples:** You agree to dedicate any *original* code you write for this project to the **Public Domain (CC0 1.0 Universal)**.

### 2. Handling Third-Party & Copied Code

If you are including code copied from another open source project (e.g., a community plugin, a library on GitHub, or a Stack Overflow snippet), **you generally do not have the right to re-license it under CC0.**

In these cases, you **must preserve the original license** by including the license header directly inside the code block.

* **Why?** Users often copy code via the "Copy" button on the rendered website. If the license is in a separate file, it gets left behind. The license must travel with the snippet.
* **Requirement:** Identify the license of the code you are copying and ensure it is compatible with distribution in this documentation.

**Example: Including an MPLv2 Licensed Snippet**

```javascript
/*
 * Copyright (c) 2026 Original Author Name
 * Licensed under the Mozilla Public License 2.0.
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at [https://mozilla.org/MPL/2.0/](https://mozilla.org/MPL/2.0/)
 */

export function importedCommunityLogic() {
  // ... existing code ...
}
```

### 3. Developer Certificate of Origin (DCO)

We require all contributors to sign off on their commits to certify that they have the right to submit the code. We adhere to the **Developer Certificate of Origin (DCO) 1.1**.

By signing off, you certify that:
* You wrote the contribution, or
* You have the right to submit it under the project's open source license (or preserve the existing license as described above).

[Read the full DCO 1.1 text here.](https://developercertificate.org/)

#### How to Sign Off

You must add a `Signed-off-by` trailer to your commit message using your real name and email.

**Important:** The name and email address in the `Signed-off-by` line **must match** the name and email address of the Git commit author.

**Automatic Sign-off:**

```bash
git commit -s -m "docs: add example for custom plugin"
```

**Resulting Commit Message:**

```text
docs: add example for custom plugin

Signed-off-by: Jane Doe <jane.doe@example.com>
```

### 4. Trademarks

Open Integration Engine™, OIE™, and the OIE logo are trademarks of the Open Integration Engine project.
