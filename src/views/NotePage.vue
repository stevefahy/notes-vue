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
import { useMobileSizeStore } from '@/stores/mobileSize'
import { storeToRefs } from 'pinia'

const mobileSizeStore = useMobileSizeStore()
const { btnSize } = storeToRefs(mobileSizeStore)

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
    showSnack()
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
      <div class="view_container" id="view_container">
        <ViewNote
          :visible="!isView"
          :splitScreen="isSplitScreen"
          :viewText="viewText"
          :updatedViewText="updatedViewTextHandler"
        />
        <EditNote
          :visible="isView"
          :splitScreen="isSplitScreen"
          :loadedText="loadedText"
          :updateViewText="updatedViewTextHandler"
          :passUpdatedViewText="updateEditTextProp"
        />
      </div>
    </template>
  </div>
  <FooterView>
    <template v-if="noteLoaded && viewText.length > 0 && !isCreate && isChanged">
      <v-btn
        :size="btnSize"
        rounded="xl"
        mat-button
        color="secondary"
        aria-label="Save Note button"
        class="contained medium breadcrumb_edit_fab button_fab"
        @click="saveNoteCallback"
      >
        <span class="icon_text">
          <span class="material-symbols-outlined button_icon white"> add_circle </span>
          Save Note
        </span>
      </v-btn>
    </template>

    <template v-if="noteLoaded && viewText.length > 0 && isCreate">
      <v-btn
        :size="btnSize"
        rounded="xl"
        mat-button
        color="secondary"
        aria-label="Create Note button"
        class="contained medium breadcrumb_edit_fab button_fab"
        @click="createNotePost"
      >
        <span class="icon_text">
          <span class="material-symbols-outlined button_icon white"> add_circle </span>
          Create Note
        </span>
      </v-btn>
    </template>

    <template v-if="noteLoaded && viewText.length === 0 && isCreate">
      <v-btn
        :size="btnSize"
        rounded="xl"
        mat-button
        color="secondary"
        aria-label="Example Note button"
        class="contained medium breadcrumb_edit_fab button_fab example_button"
        @click="exampleNote"
      >
        <span class="icon_text">
          <span class="material-symbols-outlined button_icon white"> egg </span>
          Example
        </span>
      </v-btn>
    </template>

    <template v-if="noteLoaded && !isSplitScreen">
      <v-btn
        :size="btnSize"
        rounded="xl"
        mat-button
        color="secondary"
        aria-label="Toggle View button"
        class="contained medium breadcrumb_edit_fab button_fab"
        @click="toggleEditHandlerCallback"
      >
        <template v-if="isView">
          <span class="icon_text">
            <span class="material-symbols-outlined button_icon white"> visibility </span>
            View
          </span>
        </template>

        <template v-if="!isView">
          <span class="icon_text">
            <span class="material-symbols-outlined button_icon white"> edit </span>
            Edit
          </span></template
        >
      </v-btn>
    </template>

    <template v-if="noteLoaded && !isMobile">
      <v-btn
        :size="btnSize"
        rounded="xl"
        mat-button
        color="secondary"
        aria-label="Toggle Split Screen button"
        class="contained medium breadcrumb_edit_fab button_fab split_screen_button"
        @click="toggleSplitHandlerCallback"
      >
        <template v-if="isSplitScreen">
          <span className="split_screen_icon">
            <img
              src="/assets/images/split_screen_icon_single.png"
              alt="split screen icon"
              width="30"
              height="30"
            /> </span
        ></template>

        <template v-if="!isSplitScreen">
          <span className="split_screen_icon">
            <img
              src="/assets/images/split_screen_icon_double.png"
              alt="split screen icon"
              width="30"
              height="30"
            /> </span
        ></template>
      </v-btn>
    </template>
  </FooterView>
</template>
