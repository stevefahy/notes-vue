<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { Notebook, NotebookCoverType } from '@/core/model/global'
import { addNotebook } from '@/core/helpers'
import { useAuthStore } from '@/stores/auth'
import { normalizeErrorToString } from '@/core/lib/error-message-map'
import { useSnackStore } from '@/stores/snack'
import NotebookListItem from './NotebookListItem.vue'
import FooterView from '../layout/FooterView.vue'
import AddNotebookForm from './AddNotebookForm.vue'
import { toLegacyCover } from '@/core/lib/folder-options'

const props = defineProps<{
  error?: string
  success?: boolean
  notebooks?: Notebook[]
  onNotebooksReload?: () => void | Promise<void>
}>()

const authStore = useAuthStore()
const snackStore = useSnackStore()

const { authContext } = storeToRefs(authStore)

const enableAddNotebook = ref<boolean>(false)
const localNotebooks = computed<Notebook[]>(() => props.notebooks || [])

const addNotebookFormHandler = () => {
  enableAddNotebook.value = true
}

const cancelHandler = () => {
  enableAddNotebook.value = false
}

const addNotebookHandler = async (
  notebook_name: string,
  notebook_cover: NotebookCoverType
): Promise<boolean> => {
  const token = authContext.value.token
  if (!token) return false
  try {
    const coverToSend = toLegacyCover(notebook_cover as Parameters<typeof toLegacyCover>[0])
    const response = await addNotebook(token, notebook_name, coverToSend)
    if (response.error) {
      snackStore.showErrorSnack(normalizeErrorToString(response.error), {
        fromServer: (response as { fromServer?: boolean }).fromServer === true
      })
      return false
    }
    if (response.success) {
      enableAddNotebook.value = false
      await props.onNotebooksReload?.()
      return true
    }
  } catch (err) {
    snackStore.showErrorSnack(normalizeErrorToString(err), { fromServer: false })
    return false
  }
  return false
}
</script>

<template>
  <div class="notebooks-list-wrap">
    <h2 class="page-heading">Your Notebooks</h2>
    <ul class="notebooks_list">
      <template v-for="notebook of localNotebooks" :key="notebook._id">
        <NotebookListItem :notebook_item="notebook" />
      </template>
    </ul>

    <AddNotebookForm :open="enableAddNotebook" method="create" :addNotebook="addNotebookHandler"
      :onCancel="cancelHandler" />
  </div>
  <FooterView>
    <div v-if="localNotebooks" class="fab-row">
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
