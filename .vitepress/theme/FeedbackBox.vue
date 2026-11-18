<script setup lang="ts">
// One line at the top of every documentation page, pointing readers at Contributing. The issue link itself is at the
// bottom of the page, above "Edit this page on GitHub" (IssueLink.vue).
import { withBase } from 'vitepress'

const contributing = withBase('/engine/contributing')
</script>

<template>
  <div class="feedback-box vp-doc">
    <div class="custom-block tip">
      <p>Spotted a mistake or gap? See <a :href="contributing">Contributing</a>.</p>
    </div>
  </div>
</template>

<style scoped>
.feedback-box {
  margin: 0 0 24px;
}

/* One line: tighter than a normal tip box, with no space above it. */
.feedback-box .custom-block {
  margin: 0;
  padding: 8px 16px;
}

.feedback-box .custom-block p {
  margin: 0;
}
</style>
