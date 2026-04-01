<script setup lang="ts">
import { ref, watch, toRef, defineAsyncComponent } from 'vue'
import type { NoteEditorView } from '@/core/model/global'

const ViewNoteMarkdown = defineAsyncComponent(() => import('./ViewNoteMarkdown.vue'))

const props = defineProps<NoteEditorView>()

const isLoaded = ref<boolean>(false)

const viewText = toRef(props, 'viewText')

let loadedTimer: ReturnType<typeof setTimeout>
const hideSkeleton = () => {
  loadedTimer = setTimeout(() => {
    isLoaded.value = true
    clearTimeout(loadedTimer)
  }, 300)
}

watch(
  viewText,
  () => {
    hideSkeleton()
  },
  { deep: true, immediate: true }
)

const updateViewText = (a: string) => {
  props.updatedViewText(a)
}
</script>

<template>
  <div id="view" class="note-pane note-pane--view view editnote_box">
    <div class="note-pane-scroll">
      <div class="note-card">
        <div id="viewnote_id" class="v-card-text cardcontent viewnote_content">
          <template v-if="!isLoaded">
            <div class="skeleton-placeholder" aria-hidden="true">
              <div class="skeleton-line" />
              <div class="skeleton-line" />
              <div class="skeleton-line short" />
            </div>
          </template>
          <template v-if="isLoaded">
            <ViewNoteMarkdown
              :viewText="viewText"
              :updatedViewText="updateViewText"
              :disableLinks="false"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('../../assets/styles/notebook-list-shared-css.scss');

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
