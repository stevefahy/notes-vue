<script setup lang="ts">
import { ref } from 'vue'
import type { GetNotebooks, IAuthContext } from '@/core/model/global'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { getNotebooks } from '@/core/helpers'
import NotebooksList from '@/components/notebooks/NotebooksList.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const notebooksLoaded = ref<boolean>(false)
const userNotebooks = ref<GetNotebooks>({ success: false, notebooks: [] })

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loading: boolean | null
let token: string | null

authStore.$subscribe((mutation, state) => {
  updateContext(state.authContext)
})

const showNotification = (msg: string) => {
  notificationStore.ShowNotification({
    notification: { n_status: 'error', title: 'Error!', message: msg }
  })
}

// Get the Notebooks
const loadNotebooks = async () => {
  if (!notebooksLoaded.value && token) {
    try {
      const response = await getNotebooks(token)
      if (response.error) {
        showNotification(`${response.error}`)
        return
      }
      if (response.success) {
        userNotebooks.value = response
        filterNotebooks()
      }
    } catch (err) {
      showNotification(`${err}`)
      return
    }
  }
}

// Filter Notebooks
const filterNotebooks = async () => {
  const notebooks_found = userNotebooks.value.notebooks
  const error_found = userNotebooks.value.error
  if (notebooks_found && notebooks_found.length > 0) {
    // Set an old date for those notes without any updatedAt
    notebooks_found.map((x) => {
      if (x.updatedAt === 'No date' || undefined) {
        x.updatedAt = 'December 17, 1995 03:24:00'
      }
      return x
    })
    // Sort the notebooks by updatedAt
    notebooks_found
      .sort((a, b) => {
        if (a.updatedAt !== undefined && b.updatedAt !== undefined) {
          return new Date(a.updatedAt) > new Date(b.updatedAt) ? 1 : -1
        } else {
          return a.updatedAt !== undefined ? 1 : -1
        }
      })
      .reverse()
    userNotebooks.value = { success: true, notebooks: notebooks_found }
    notebooksLoaded.value = true
  }
  if (error_found) {
    showNotification(error_found)
  }
}

const updateContext = (context: IAuthContext) => {
  loading = context.loading
  token = context.token
}

const getAuth = async () => {
  const auth = await authStore.getAuth()
  if (auth.value !== null) {
    updateContext(auth.value)
    loadNotebooks()
  }
}

getAuth()
</script>

<template>
  <div v-if="!notebooksLoaded">
    <LoadingScreen />
  </div>
  <div class="page_scrollable_header_breadcrumb_footer_list">
    <div v-if="notebooksLoaded && userNotebooks.notebooks">
      <NotebooksList
        :error="userNotebooks.error"
        :success="userNotebooks.success"
        :notebooks="userNotebooks.notebooks"
      />
    </div>
  </div>
</template>
