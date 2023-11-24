<script setup lang="ts">
import { ref } from 'vue'
import type { Notebook } from '@/core/model/global'
import DateFormat from '@/core/lib/date-format'

const props = defineProps(['notebookLoaded', 'notebook_item'])

const notebook_item$ = ref<Notebook | null>(props.notebook_item)
const notebookLoadedRef = props.notebookLoaded

const dateFormat = DateFormat
</script>

<template>
  <li class="notebooks_list_bg">
    <v-card>
      <v-card-text class="cardcontent">
        <div class="notebooks_list_outer">
          <div
            class="notebooks_list_left"
            :class="!notebookLoadedRef ? '' : 'tab_' + notebook_item$!.notebook_cover"
          >
            <div v-if="!notebookLoadedRef">
              <v-skeleton-loader type="card" height="10px"></v-skeleton-loader>
            </div>
          </div>
          <div class="notebooks_list_right">
            <template v-if="!notebookLoadedRef">
              <v-skeleton-loader type="list-item"></v-skeleton-loader>
              <v-skeleton-loader type="list-item"></v-skeleton-loader>
            </template>
            <template v-if="notebookLoadedRef">
              <div>{{ notebook_item$!.notebook_name }}</div>
              <div class="date_format">
                <div>
                  {{ dateFormat(notebook_item!.updatedAt!) }}
                </div>
              </div>
            </template>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </li>
</template>

<style scoped>
@import url('../../assets/styles/notebook-list-shared-css.scss');
</style>
