<script setup lang="ts">
import { ref } from 'vue'
import type { GetNotebooks, IAuthContext } from '@/core/model/global'
import { useAuthStore } from '@/stores/auth'
import { useSnackStore } from '@/stores/snack'
import { getNotebooks } from '@/core/helpers'
import NotebooksList from '@/components/notebooks/NotebooksList.vue'
import { normalizeErrorToString } from '@/core/lib/error-message-map'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'

const AC = APPLICATION_CONSTANTS

const authStore = useAuthStore()
const snackStore = useSnackStore()

const notebooksLoaded = ref<boolean>(false)
const loadError = ref<boolean>(false)
const userNotebooks = ref<GetNotebooks>({ success: false, notebooks: [] })

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loading: boolean | null
let token: string | null

authStore.$subscribe((mutation, state) => {
  updateContext(state.authContext)
})

const loadNotebooks = async () => {
  if (!token) return
  try {
    const response = await getNotebooks(token)
    if (response.error) {
      snackStore.showErrorSnack(normalizeErrorToString(response.error), {
        fromServer: (response as { fromServer?: boolean }).fromServer === true
      })
      notebooksLoaded.value = true
      loadError.value = true
      return
    }
    if (response.success) {
      userNotebooks.value = response
      filterNotebooks()
    }
  } catch (err) {
    snackStore.showErrorSnack(normalizeErrorToString(err), { fromServer: false })
    notebooksLoaded.value = true
    loadError.value = true
    return
  }
}

// Filter Notebooks
const filterNotebooks = async () => {
  const notebooks_found = userNotebooks.value.notebooks
  const error_found = userNotebooks.value.error

  if (!Array.isArray(notebooks_found)) {
    notebooksLoaded.value = true
    return
  }
  if (notebooks_found.length === 0) {
    userNotebooks.value = { success: true, notebooks: [] }
    notebooksLoaded.value = true
    loadError.value = false
  } else {
    notebooks_found.map((x) => {
      if (x.updatedAt === 'No date' || undefined) {
        x.updatedAt = 'December 17, 1995 03:24:00'
      }
      return x
    })
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
    loadError.value = false
  }

  if (error_found) {
    const fromServer = (userNotebooks.value as { fromServer?: boolean }).fromServer
    snackStore.showErrorSnack(normalizeErrorToString(error_found), {
      fromServer: fromServer === true
    })
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
  <div v-else-if="loadError" class="page_scrollable_header_breadcrumb_footer_list loading_routes error-state">
    <p>Unable to load notebooks.</p>
    <router-link class="back-link" :to="AC.DEFAULT_PAGE">Back to Notebooks</router-link>
  </div>
  <div v-else class="page_scrollable_header_breadcrumb_footer_list">
    <div v-if="notebooksLoaded && userNotebooks.notebooks">
      <NotebooksList :error="userNotebooks.error" :success="userNotebooks.success" :notebooks="userNotebooks.notebooks"
        :onNotebooksReload="loadNotebooks" />
    </div>
  </div>
</template>
