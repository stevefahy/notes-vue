<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { NotebookItem } from '@/core/model/global'
import NotebookListHtml from './NotebookListHtml.vue'

defineProps<NotebookItem>()
const notebookLoaded = ref<boolean>(false)

onMounted(() => {
  hideSkeleton()
})

let loadedTimer: NodeJS.Timeout
const hideSkeleton = () => {
  loadedTimer = setTimeout(() => {
    notebookLoaded.value = true
    clearTimeout(loadedTimer)
  }, 300)
}
</script>

<template>
  <template v-if="!notebookLoaded">
    <NotebookListHtml notebook_item="null" :notebookLoaded="notebookLoaded" />
  </template>
  <template v-if="notebookLoaded">
    <router-link :to="'/notebook/' + notebook_item._id">
      <NotebookListHtml :notebook_item="notebook_item" :notebookLoaded="notebookLoaded" />
    </router-link>
  </template>
</template>

<style scoped>
@import url('../../assets/styles/notebook-list-shared-css.scss');
</style>
