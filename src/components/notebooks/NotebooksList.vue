<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { GetNotebooks, Notebook, IAuthContext, NotebookCoverType } from '@/core/model/global'
import { addNotebook } from '@/core/helpers'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import NotebookListItem from './NotebookListItem.vue'
import FooterView from '../layout/FooterView.vue'
import AddNotebookForm from './AddNotebookForm.vue'
import { toLegacyCover } from '@/core/lib/folder-options'

const props = defineProps<GetNotebooks>()

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const { authContext } = storeToRefs(authStore)

const enableAddNotebook = ref<boolean>(false)
const userNotebooks = ref<Notebook[] | []>([])
const isLoaded = ref<boolean>(false)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loading: boolean | null
let token: string | null

authStore.$subscribe((mutation, state) => {
  updateContext(state.authContext)
})

const updateContext = (context: IAuthContext) => {
  loading = context.loading
  token = context.token
  initUserNotebooks(props)
}

const initUserNotebooks = (notebooks: GetNotebooks) => {
  if (notebooks && notebooks.success && notebooks.notebooks) {
    const noteBooksArray = notebooks.notebooks
    userNotebooks.value = noteBooksArray
    isLoaded.value = true
  }
  if (notebooks && notebooks.error) {
    showNotification(notebooks.error)
  }
}

const showNotification = (msg: string) => {
  notificationStore.ShowNotification({
    notification: { n_status: 'error', title: 'Error!', message: msg }
  })
}

const addNotebookFormHandler = () => {
  enableAddNotebook.value = true
}

const cancelHandler = () => {
  enableAddNotebook.value = false
}

const addNotebookHandler = async (notebook_name: string, notebook_cover: NotebookCoverType) => {
  if (token) {
    try {
      const coverToSend = toLegacyCover(notebook_cover as Parameters<typeof toLegacyCover>[0])
      const response = await addNotebook(token, notebook_name, coverToSend)
      if (response.error) {
        showNotification(`${response.error}`)
        return
      }
      if (response.success) {
        const prevNotebooks = userNotebooks.value
        userNotebooks.value = [
          {
            _id: response.notebook._id,
            notebook_name: response.notebook.notebook_name,
            notebook_cover: response.notebook.notebook_cover,
            updatedAt: response.notebook.updatedAt,
            createdAt: response.notebook.createdAt
          },
          ...prevNotebooks
        ]
      }
    } catch (err) {
      showNotification(`${err}`)
      return
    }
  }
}

if (authContext.value.success) {
  updateContext(authContext.value)
}
</script>

<template>
  <div v-if="!isLoaded">
    <LoadingScreen />
  </div>
  <div v-if="userNotebooks" class="notebooks-list-wrap">
    <h2 class="page-heading">Your Notebooks</h2>
    <ul class="notebooks_list">
      <template v-for="notebook of userNotebooks" :key="notebook._id">
        <NotebookListItem :notebook_item="notebook" />
      </template>
    </ul>

    <AddNotebookForm :open="enableAddNotebook" method="create" :addNotebook="addNotebookHandler"
      :onCancel="cancelHandler" />
  </div>
  <FooterView>
    <div v-if="userNotebooks" class="fab-row">
      <button type="button" class="fab" aria-label="Add notebook button" @click="addNotebookFormHandler">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 1v10M1 6h10" stroke="white" stroke-width="2" stroke-linecap="round" />
        </svg>
        New Notebook
      </button>
    </div>
  </FooterView>
</template>

<style scoped>
@import url('../../assets/styles/notebook-list-shared-css.scss');

:global(li.notebooks_list_bg .vcard) {
  width: 100%;
  border-radius: 14px;
  border: 1px solid var(--theme-border);
  box-shadow: var(--theme-shadow-sm);
}

.page-heading {
  font-family: var(--theme-font-serif);
  font-size: 18px;
  color: var(--theme-text-muted);
  margin: 16px 16px 0;
}

.notebooks-list-wrap {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .notebooks-list-wrap {
    max-width: 100%;
  }

  .page-heading {
    font-size: 16px;
  }
}

.fab-row {
  width: 100%;
  display: flex;
  justify-content: center;
}

.fab {
  background: var(--theme-green);
  color: white;
  border: none;
  border-radius: var(--theme-radius-sm);
  padding: 12px 22px;
  font-family: var(--theme-font-sans);
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 7px;
  box-shadow: 0 4px 18px rgba(46, 125, 82, 0.38);
  cursor: pointer;
}

.fab:hover {
  background: var(--theme-green-accent);
}
</style>
