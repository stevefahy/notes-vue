<script setup lang="ts">
import { watch, ref, toRef, defineAsyncComponent } from 'vue'
import fm from 'front-matter'
import type { ViewNoteThumb } from '@/core/model/global'
import { truncateMarkdownPreview } from '@/core/lib/truncateMarkdownPreview'

const ViewNoteMarkdown = defineAsyncComponent(() => import('./ViewNoteMarkdown.vue'))

const props = defineProps<ViewNoteThumb>()

const text = toRef(props, 'text')
const isLoaded = ref<boolean>(false)
let content: string

let loadedTimer: ReturnType<typeof setTimeout>
const hideSkeleton = () => {
  loadedTimer = setTimeout(() => {
    isLoaded.value = true
    clearTimeout(loadedTimer)
  }, 600)
}

watch(
  text,
  (val: string) => {
    const { body: raw } = fm(val ?? '')
    content = truncateMarkdownPreview(raw)
    hideSkeleton()
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <template v-if="!isLoaded">
    <div class="loading-placeholder">Loading...</div>
  </template>
  <template v-else>
    <div class="box">
      <article class="viewnote_content viewnote_thumb">
        <template v-if="isLoaded">
          <ViewNoteMarkdown :viewText="content" :disableLinks="true" />
        </template>
      </article>
    </div>
  </template>
</template>

<style scoped>
.edit {
  background-color: aliceblue;
  outline: 0px solid transparent;
}

.box {
  display: flex;
  flex-flow: column;
  max-height: 200px;
  overflow: hidden;
}

.box .row {
  border: 1px dotted grey;
}

.box .row.header {
  flex: 0 1 auto;
}

.box .row.content {
  flex: 1 1 auto;
}

.box .row.footer {
  flex: 0 1 40px;
}

.loading-placeholder {
  min-height: 40px;
  color: var(--theme-text-muted);
  font-size: 12px;
}
</style>
