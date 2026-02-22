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
    show: visible,
    hide: !visible
  }">
    <v-card>
      <v-card-text class="cardcontent">
        <article id="viewnote_id" class="viewnote_content viewer viewnote_content">
          <template v-if="!isLoaded">
            <v-skeleton-loader type="list-item"></v-skeleton-loader>
          </template>
          <template v-if="isLoaded">
            <ViewNoteMarkdown :viewText="viewText" :updatedViewText="updateViewText"
              :disableLinks="false" />
          </template>
        </article>
      </v-card-text>
    </v-card>
  </div>
</template>

<style>
@import url('../../assets/styles/notebook-list-shared-css.scss');
</style>
