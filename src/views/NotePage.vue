<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { createNote, saveNote, getNote, getNotebook } from '@/core/helpers'
import FooterView from '@/components/layout/FooterView.vue'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'
import { useNotebookEditStore } from '@/stores/notebookEdit'
import { useNotificationStore } from '@/stores/notification'
import { useSnackStore } from '@/stores/snack'
import { useAuthStore } from '@/stores/auth'
import type { IAuthContext } from '@/core/model/global'
import useWindowDimensions from '../core/lib/useWindowDimension'
import { initScrollSync, removeScrollListeners } from '../core/lib/scroll_sync'
import ViewNote from '../components/note/ViewNote.vue'
import EditNote from '@/components/note/EditNote.vue'

const authStore = useAuthStore()
const notebookEditStore = useNotebookEditStore()
const notificationStore = useNotificationStore()
const snackStore = useSnackStore()

const AC = APPLICATION_CONSTANTS

const router = useRouter()
const route = useRoute()
const notebookId = route.params.notebookId
const noteId = route.params.noteId

let navigationUrl: string
let token: string | null
let new_note = false
let width: number = useWindowDimensions().value.width

const WELCOME_NOTE = ref<string>('')
const viewText = ref<string>('')
const loadedText = ref<string>('')
const isMobile = ref<boolean>(false)
const originalText = ref<string>('')
const updateEditTextProp = ref<string>('')
const noteLoaded = ref<boolean>(false)
const notebookLoaded = ref<boolean>(false)
const autoSave = ref<boolean>(false)
const isChanged = ref<boolean>(false)
const isCreate = ref<boolean>(new_note)
const isView = ref<boolean>(new_note)
const isSplitScreen = ref<boolean>(false)

const windowDimensions = useWindowDimensions().value
windowDimensions.addListener()

onUnmounted(() => {
  removeScrollListeners()
  windowDimensions.removeListener()
})

onBeforeRouteLeave((to, from, next) => {
  navigationUrl = to.fullPath
  if (isChanged.value && !isCreate.value) {
    autoSave.value = true
  }
  next()
})

// Wait for the Markdown to load before initializing scroll sync
setTimeout(() => {
  initScrollSync()
}, 500)

if (noteId === 'create-note') {
  new_note = true
  isCreate.value = true
  isView.value = false
} else {
  isView.value = true
}

const dimensionsChange = () => {
  if (width < AC.SPLITSCREEN_MINIMUM_WIDTH) {
    isSplitScreen.value = false
    isMobile.value = true
  } else {
    isMobile.value = false
  }
}

watch(windowDimensions, (newVal) => {
  width = newVal.width
  dimensionsChange()
})

watch(autoSave, (newVal) => {
  if (newVal) {
    saveNoteCheck()
  }
})

watch(isChanged, (newVal) => {
  if (newVal) {
    saveNoteCheck()
  }
})

watch(isView, (newVal) => {
  if (newVal) {
    saveNoteCheck()
  }
})

watch(isCreate, (newVal) => {
  if (newVal) {
    saveNoteCheck()
  }
})

const showSnack = () => {
  snackStore.ShowSnack({ n_status: true, message: 'Note Saved' })
}

const exampleNote = () => {
  if (!isMobile.value) {
    isSplitScreen.value = true
  }
  updatedViewTextHandler(WELCOME_NOTE.value)
}

const updatedViewTextHandler = (updatedViewText: string) => {
  updateIsChanged(updatedViewText)
  viewText.value = updatedViewText
  updateEditTextProp.value = updatedViewText
}

const updateIsChanged = (content: string) => {
  if (content !== originalText.value) {
    isChanged.value = true
  } else {
    isChanged.value = false
  }
}

// Create Note
const createNotePost = async () => {
  if (token && notebookId && viewText.value) {
    autoSave.value = false
    const note_obj = { notebookId: notebookId as string, note: viewText.value }
    try {
      const response = await createNote(token, note_obj)
      notebookLoaded.value = true
      if (response.error) {
        showNotification(`${response.error}`)
        return
      }
      if (response.success) {
        isCreate.value = false
        isChanged.value = false
        autoSave.value = false
        router.push(`/notebook/${notebookId}`)
      }
    } catch (err) {
      showNotification(`${err}`)
      return
    }
  }
}

const saveNoteCheck = async () => {
  if (autoSave.value && isChanged.value && (isView.value || isChanged.value) && !isCreate.value) {
    const noteSaved = async () => {
      await saveNoteCallback()
      showSnack()
      autoSave.value = false
      isChanged.value = false
      router.push(`${navigationUrl}`)
    }
    noteSaved()
  }
}

const toggleEditHandlerCallback = () => {
  isView.value = !isView.value
}

const toggleSplitHandlerCallback = () => {
  isSplitScreen.value = !isSplitScreen.value
}

const saveNoteCallback = async () => {
  if (token && notebookId && noteId && viewText) {
    let response
    try {
      response = await saveNote(token, notebookId as string, noteId as string, viewText.value)
      if (response.error) {
        showNotification(`${response.error}`)
        return
      }
      if (response.success) {
        isChanged.value = false
        autoSave.value = false
        originalText.value = viewText.value
        showSnack()
        // Change to View Mode
        if (isView.value) {
          toggleEditHandlerCallback()
        }
        return response
      }
    } catch (err) {
      showNotification(`${err}`)
      return
    }
  } else {
    return
  }
  return
}

const loadMarkdown = async () => {
  await fetch(`/markdown/welcome_markdown_angular.md`)
    .then((response) => response.text())
    .then((text) => {
      WELCOME_NOTE.value = text
    })
}

const loadNote = async () => {
  if (
    !isCreate.value &&
    notebookId &&
    noteId &&
    noteId !== 'create-note' &&
    !noteLoaded.value &&
    token
  ) {
    noteLoaded.value = false
    try {
      const response = await getNote(token, notebookId as string, noteId as string)
      if (response.error) {
        showNotification(`${response.error}`)
        return
      }
      if (response.success) {
        viewText.value = response.note.note
        loadedText.value = response.note.note
        originalText.value = response.note.note
        noteLoaded.value = true
      }
    } catch (err) {
      showNotification(`${err}`)
      return
    }
  } else {
    noteLoaded.value = true
  }
}

const loadNotebook = async () => {
  if (!notebookLoaded.value && token && notebookId) {
    notebookLoaded.value = false
    try {
      const response = await getNotebook(token, notebookId as string)
      notebookLoaded.value = true
      if (response.error) {
        showNotification(`${response.error}`)
        return
      }
      if (response.success) {
        notebookEditStore.edited = response.notebook
      }
    } catch (err) {
      showNotification(`${err}`)
      notebookLoaded.value = true
      return
    }
  }
}

const updateContext = (context: IAuthContext) => {
  token = context.token
}

const showNotification = (msg: string) => {
  notificationStore.ShowNotification({
    notification: { n_status: 'error', title: 'Error!', message: msg }
  })
}

authStore.$subscribe((mutation, state) => {
  updateContext(state.authContext)
})

const getAuth = async () => {
  const auth = await authStore.getAuth()
  if (auth.value !== null) {
    updateContext(auth.value)
    loadNote()
    loadNotebook()
    loadMarkdown()
    dimensionsChange()
  }
}

getAuth()
</script>

<template>
  <template v-if="!noteLoaded || token === null">
    <LoadingScreen />
  </template>

  <div class="page_scrollable_header_breadcrumb_footer">
    <template v-if="noteLoaded && token !== null">
      <div class="view_container" :class="{ editnote_box_split: isSplitScreen }" id="view_container">
        <EditNote :visible="!isView || isSplitScreen" :splitScreen="isSplitScreen" :loadedText="loadedText"
          :updateViewText="updatedViewTextHandler" :passUpdatedViewText="updateEditTextProp" />
        <ViewNote :visible="isView || isSplitScreen" :splitScreen="isSplitScreen" :viewText="viewText"
          :updatedViewText="updatedViewTextHandler" />
      </div>
    </template>
  </div>
  <FooterView>
    <div v-if="noteLoaded" class="nb-footer-row">
      <template v-if="viewText.length > 0 && !isCreate && isChanged">
        <button type="button" class="btn-action-primary" aria-label="Save Note button" @click="saveNoteCallback">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Save Note
        </button>
      </template>
      <template v-if="viewText.length > 0 && isCreate">
        <button type="button" class="btn-action-primary" aria-label="Create Note button" @click="createNotePost">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          Create Note
        </button>
      </template>
      <template v-if="viewText.length === 0 && isCreate">
        <button type="button" class="btn-action-ghost" aria-label="Example Note button" @click="exampleNote">
          <span class="material-symbols-outlined" aria-hidden="true">egg</span>
          Example
        </button>
      </template>
      <template v-if="!isSplitScreen">
        <button type="button" class="btn-action-ghost" :aria-label="isView ? 'Switch to Edit' : 'Switch to View'"
          @click="toggleEditHandlerCallback">
          <template v-if="isView">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </template>
          <template v-else>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            View
          </template>
        </button>
      </template>
      <template v-if="!isMobile">
        <button type="button" class="btn-action-ghost" aria-label="Toggle split screen"
          @click="toggleSplitHandlerCallback">
          <template v-if="isSplitScreen">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="6" y="2" width="12" height="20" rx="2" />
            </svg>
          </template>
          <template v-else>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="8" height="20" rx="2" />
              <rect x="14" y="2" width="8" height="20" rx="2" />
            </svg>
          </template>
          Split Screen
        </button>
      </template>
    </div>
  </FooterView>
</template>
