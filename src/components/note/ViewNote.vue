<script setup lang="ts">
import { ref, watch, toRef } from 'vue'
import matter from 'gray-matter'
import { Buffer } from 'buffer'
import type { NoteEditorView } from '@/core/model/global'
import ViewNoteMarkdown from './ViewNoteMarkdown.vue'

  ; (globalThis as any).Buffer = Buffer

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
    content = matter(val).content
    contextView.value = content
    hideSkeleton()
  },
  { deep: true, immediate: true }
)

const updateViewText = (a: any) => {
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
            <ViewNoteMarkdown :splitScreen="splitScreen" :viewText="contextView" :updatedViewText="updateViewText"
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
