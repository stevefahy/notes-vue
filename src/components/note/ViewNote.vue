<script setup lang="ts">
import { ref, watch, toRef, defineAsyncComponent } from 'vue'
import fm from 'front-matter'
import type { NoteEditorView } from '@/core/model/global'

const ViewNoteMarkdown = defineAsyncComponent(() => import('./ViewNoteMarkdown.vue'))

const props = defineProps<NoteEditorView>()

let content: string
const contextView = ref<string>('')
const isLoaded = ref<boolean>(false)

const viewText = toRef(props, 'viewText')
const splitScreen = toRef(props, 'splitScreen')
const visible = toRef(props, 'visible')

let loadedTimer: ReturnType<typeof setTimeout>
const hideSkeleton = () => {
  loadedTimer = setTimeout(() => {
    isLoaded.value = true
    clearTimeout(loadedTimer)
  }, 300)
}

watch(
  viewText,
  (val) => {
    content = fm(val).body
    contextView.value = content
    hideSkeleton()
  },
  { deep: true, immediate: true }
)

const updateViewText = (a: string) => {
  props.updatedViewText(a)
}
</script>

<template>
  <div id="view" :class="{
    view: true,
    'view_split show': splitScreen,
    editnote_box: true,
    show: visible && !splitScreen,
    hide: !visible && !splitScreen
  }">
    <div class="note-card">
      <div class="v-card-text cardcontent viewnote_content">
        <article id="viewnote_id" class="viewnote_content viewer">
          <template v-if="!isLoaded">
            <div class="skeleton-placeholder" aria-hidden="true">
              <div class="skeleton-line" />
              <div class="skeleton-line" />
              <div class="skeleton-line short" />
            </div>
          </template>
          <template v-if="isLoaded">
            <ViewNoteMarkdown :viewText="viewText" :updatedViewText="updateViewText" :disableLinks="false" />
          </template>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('../../assets/styles/notebook-list-shared-css.scss');

/* View pane: content flows on view background (var(--theme-bg)), no white card */
.note-card {
  background: transparent;
  border: none;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
}

.skeleton-placeholder {
  padding: 8px 0;
}

.skeleton-line {
  height: 12px;
  background: var(--theme-border-input);
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-line.short {
  width: 60%;
}
</style>
