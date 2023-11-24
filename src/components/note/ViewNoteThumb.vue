<script setup lang="ts">
import { watch, ref, toRef } from 'vue'
import type { ViewNoteThumb } from '@/core/model/global'
import ViewNoteMarkdown from './ViewNoteMarkdown.vue'

const props = defineProps<ViewNoteThumb>()

const text = toRef(props, 'text')
const isLoaded = ref<boolean>(false)
let content: string

let loadedTimer: NodeJS.Timeout
const hideSkeleton = () => {
  loadedTimer = setTimeout(() => {
    isLoaded.value = true
    clearTimeout(loadedTimer)
  }, 600)
}

watch(
  text,
  (val: any) => {
    content = val
    hideSkeleton()
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <template v-if="!isLoaded">
    <v-skeleton-loader type="list-item"></v-skeleton-loader>
    <v-skeleton-loader type="list-item"></v-skeleton-loader>
  </template>
  <template v-if="isLoaded">
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
</style>
