<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { GetNotebooks, Notebook, IAuthContext } from '@/core/model/global'
import { addNotebook } from '@/core/helpers'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import NotebookListItem from './NotebookListItem.vue'
import FooterView from '../layout/FooterView.vue'
import AddNotebookForm from './AddNotebookForm.vue'
import { useMobileSizeStore } from '@/stores/mobileSize'

const mobileSizeStore = useMobileSizeStore()
const { btnSize } = storeToRefs(mobileSizeStore)

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

const addNotebookHandler = async (notebook_name: string, notebook_cover: string) => {
  if (token) {
    try {
      const response = await addNotebook(token, notebook_name, notebook_cover)
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
  <div v-if="!isLoaded"><LoadingScreen /></div>
  <div v-if="userNotebooks">
    <ul class="notebooks_list">
      <template v-for="notebook of userNotebooks" :key="notebook._id">
        <NotebookListItem :notebook_item="notebook" />
      </template>
      <template v-if="enableAddNotebook"
        ><AddNotebookForm
          method="create"
          :addNotebook="addNotebookHandler"
          :onCancel="cancelHandler"
        ></AddNotebookForm
      ></template>
    </ul>
  </div>
  <FooterView>
    <template v-if="userNotebooks">
      <v-btn
        :size="btnSize"
        rounded="xl"
        color="secondary"
        aria-label="Add notebook button"
        class="contained medium breadcrumb_edit_fab button_fab"
        @click="addNotebookFormHandler"
      >
        <span class="icon_text">
          <span class="material-symbols-outlined button_icon white"> add_circle </span>
          Add Notebook
        </span>
      </v-btn>
    </template>
  </FooterView>
</template>

<style scoped>
@import url('../../assets/styles/notebook-list-shared-css.scss');
</style>
