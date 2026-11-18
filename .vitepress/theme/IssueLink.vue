<script setup lang="ts">
// "Open an issue about this page", above "Edit this page on GitHub" at the bottom of every documentation page.
import { useData, useRoute } from 'vitepress'

const REPO = 'https://github.com/OpenIntegrationEngine/docs-website'
const SITE = 'https://docs.openintegrationengine.org'

const { page } = useData()
const route = useRoute()

// A new issue with the page title and address filled in. Rendered with the published address of the page; a click
// replaces it with the address the reader is on, including the section they jumped to.
function issueUrl(here: string): string {
  const title = `Docs: ${page.value.title || route.path}`
  const body = `Page: ${here}\n\nWhat is wrong or missing:\n\n`
  return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
}

function onIssueClick(e: Event) {
  (e.currentTarget as HTMLAnchorElement).href = issueUrl(location.href)
}
</script>

<template>
  <div class="issue-link">
    <a class="issue-link-button" :href="issueUrl(SITE + route.path)" target="_blank" rel="noopener" @click="onIssueClick">
      <span class="vpi-circle-dot issue-link-icon" />
      Open an issue about this page
    </a>
  </div>
</template>

<style scoped>
/* Styled like VitePress's "Edit this page on GitHub" link right below it. */
.issue-link-button {
  display: inline-flex;
  align-items: center;
  line-height: 32px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  transition: color 0.25s;
}

.issue-link-button:hover {
  color: var(--vp-c-brand-2);
}

.issue-link-icon {
  margin-right: 8px;
}

/* A circle with a dot, like GitHub's open issue icon, drawn the way VitePress draws its own icons. */
.vpi-circle-dot {
  --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Ccircle cx='12' cy='12' r='1'/%3E%3C/svg%3E");
}
</style>
