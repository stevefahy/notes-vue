<script setup lang="ts">
import { computed } from 'vue'
import type { Notebook } from '@/core/model/global'
import DateFormat from '@/core/lib/date-format'
import { mapLegacyCover } from '@/core/lib/folder-options'

const props = defineProps<{
  notebookLoaded: boolean
  notebook_item: Notebook | null
}>()

const displayCover = computed(() => {
  if (!props.notebookLoaded || !props.notebook_item?.notebook_cover) return 'loading'
  return mapLegacyCover(props.notebook_item.notebook_cover)
})

const tabClass = computed(() => `tab_${displayCover.value}`)
const spineClass = computed(() => `nb-spine-${displayCover.value}`)

const dateFormat = DateFormat
</script>

<template>
  <li class="notebooks_list_bg">
    <div class="vcard">
      <div class="cardcontent"></div>
      <div class="notebooks_list_outer">
        <div class="notebooks_list_left" :class="tabClass">
          <div :class="spineClass" />
        </div>
        <div class="notebooks_list_right">
          <template v-if="!notebookLoaded">
            <div class="loading-placeholder">Loading...</div>
          </template>
          <template v-else-if="notebook_item">
            <div>{{ notebook_item.notebook_name }}</div>
            <div class="date_format">
              {{ dateFormat(notebook_item.updatedAt ?? '') }}
            </div>
          </template>
        </div>
        <span v-if="notebookLoaded && notebook_item?.noteCount !== undefined" class="nb-count">
          {{ notebook_item.noteCount }} {{ notebook_item.noteCount === 1 ? 'note' : 'notes' }}
        </span>
        <div class="notebooks_list_arrow">›</div>
      </div>
    </div>
  </li>
</template>

<style scoped>
@import url('../../assets/styles/notebook-list-shared-css.scss');
</style>
