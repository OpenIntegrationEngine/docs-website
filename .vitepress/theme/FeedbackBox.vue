<script setup lang="ts">
// A box at the top of every documentation page: an issue link for readers, the Contributing page for developers.
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
  <div class="feedback-box vp-doc">
    <div class="custom-block tip">
      <p class="custom-block-title">Help improve this page</p>
      <p>Spotted a mistake or a gap?
        <a :href="issueUrl(SITE + route.path)" target="_blank" rel="noopener" @click="onIssueClick">Open an issue</a>.
        It opens with this page's address filled in.</p>
      <p>Developers: changes come in as pull requests. See <a href="/engine/contributing">Contributing</a>.</p>
    </div>
  </div>
</template>

<style scoped>
.feedback-box {
  margin: 0 0 24px;
}
</style>
