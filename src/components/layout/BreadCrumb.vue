<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PageType, NotebookType, NotebookCoverType } from '@/core/model/global'
import { useRoute } from 'vue-router'
import NotebooksLink from './NotebooksLink.vue'
import NotebooksNolink from './NotebooksNolink.vue'
import { useNotebookEditStore } from '../../stores/notebookEdit'

const notebookEditStore = useNotebookEditStore()

const pageLayout = ref<PageType>('other')
const notebook = ref<NotebookType>({
  name: '',
  cover: 'default',
  id: ''
})
const notebookLoaded = ref<boolean>(false)

const route = useRoute()

watch(route, (newValue) => {
  if (newValue.name) {
    setPageLayout(newValue.name.toString())
  }
})

notebookEditStore.$subscribe((mutation, state) => {
  const edited = state.edited
  if (edited && edited.notebook_name !== null && edited._id !== null) {
    if (edited && edited.notebook_cover) {
      notebook.value = {
        id: edited._id,
        name: edited.notebook_name,
        cover: edited.notebook_cover as NotebookCoverType
      }
      notebookLoaded.value = true
    }
  }
})

const resetNotebook = () => {
  notebook.value = {
    id: '',
    name: '',
    cover: 'default'
  }
}

const setPageLayout = (url: string) => {
  if (url === 'notebooks') {
    pageLayout.value = 'notebooks'
    resetNotebook()
  } else if (url === 'notebook') {
    pageLayout.value = 'notebook'
  } else if (url === 'note') {
    pageLayout.value = 'note'
  } else if (url === 'profile') {
    pageLayout.value = 'profile'
  } else {
    pageLayout.value = 'other'
  }
}

const editNotebook = () => {
  notebookEditStore.editing = true
}
</script>

<template>
  <template v-if="pageLayout !== 'other'">
    <div>
      <div role="presentation" class="breadcrumb_container">
        <div class="breadcrumbs_inner">
          <!-- PROFILE -->
          <template v-if="pageLayout === 'profile'">
            <NotebooksLink />
          </template>

          <template v-if="pageLayout === 'profile'">
            <span class="breadcrumb_link">
              <span class="breadcrumb_link_icon">
                <span class="breadcrumb_seperator">/</span>
              </span>
              <span class="breadcrumb_icon"><v-icon>account_circle</v-icon></span>
              Profile
            </span>
          </template>

          <!-- NOTEBOOKS  -->
          <template v-if="pageLayout === 'notebook'">
            <NotebooksLink />
          </template>

          <!-- NOTEBOOKS / NOTEBOOK  -->
          <template v-if="pageLayout === 'notebooks'">
            <NotebooksNolink />
          </template>
          <template v-if="pageLayout === 'notebook' && notebook && notebook.name">
            <span class="breadcrumb_link">
              <span class="breadcrumb_link_icon">
                <span class="breadcrumb_seperator">/</span>
              </span>
              <span
                :class="
                  'material-icons-outlined icon_notebook breadcrumb_icon notebook_cover_' +
                  notebook.cover
                "
              >
                description
              </span>
              <span class="breadcrumb_link_btn'">
                {{ notebook.name }}
              </span>
            </span>
          </template>

          <!-- NOTEBOOKS / NOTEBOOK / NOTE  -->
          <div v-if="pageLayout === 'note'">
            <NotebooksLink />
          </div>
          <div v-if="notebook.name && pageLayout === 'note'">
            <router-link :to="'/notebook/' + notebook.id">
              <span class="breadcrumb_link">
                <span class="breadcrumb_link_icon">
                  <span class="breadcrumb_seperator">/</span>
                </span>
                <span
                  :class="
                    'material-icons-outlined icon_notebook breadcrumb_icon notebook_cover_' +
                    notebook.cover
                  "
                >
                  description
                </span>
                <span class="breadcrumb_link_btn">
                  {{ notebook.name }}
                </span>
              </span>
            </router-link>
          </div>

          <!-- NOTE  -->
          <template v-if="notebook.name && pageLayout === 'note'">
            <span class="breadcrumb_link">
              <span class="breadcrumb_link_icon">
                <span class="breadcrumb_seperator">/</span>
              </span>
              <span class="material-icons-outlined note icon_note breadcrumb_icon"> note </span>
              Note
            </span>
          </template>

          <!-- EDIT NOTEBOOK BUTTON  -->
          <template v-if="pageLayout === 'notebook'">
            <div class="breadcrumb_edit_btn">
              <v-btn
                class="breadcrumb_edit_fab material-symbols-outlined edit_icon edit_icon_small"
                @click="editNotebook"
                icon="edit"
                width="30px"
                height="30px"
              >
              </v-btn>
            </div>
          </template>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
@import url('../../assets/styles/breadcrumb_shared.scss');
</style>
