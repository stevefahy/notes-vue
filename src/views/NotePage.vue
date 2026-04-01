<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { createNote, saveNote, getNote, getNotebook } from '@/core/helpers'
import FooterView from '@/components/layout/FooterView.vue'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'
import { useNotebookEditStore } from '@/stores/notebookEdit'
import { useSnackStore } from '@/stores/snack'
import { useAuthStore } from '@/stores/auth'
import type { IAuthContext } from '@/core/model/global'
import { normalizeErrorToString } from '@/core/lib/error-message-map'
import useWindowDimensions from '../core/lib/useWindowDimension'
import {
  alignNotePanesScroll,
  captureSplitEnterScrollSnap,
  detachScrollSyncListeners,
  initScrollSync,
  removeScrollSync,
  stabilizeSplitEnterScroll
} from '../core/lib/scroll_sync'
import {
  commitNoteShellTransition,
  getNoteShellEditViewTransitionCleanupMs,
  getNoteShellSplitTransitionCleanupMs
} from '../core/lib/noteShellDom'
import type { NoteShellLayout } from '../core/lib/noteShellDom'
import type { SplitEnterScrollSnap } from '../core/lib/scroll_sync'
import { useNoteShellSwipeNavigation } from '../core/lib/useNoteShellSwipeNavigation'
import ViewNote from '../components/note/ViewNote.vue'
import EditNote from '@/components/note/EditNote.vue'

const authStore = useAuthStore()
const notebookEditStore = useNotebookEditStore()
const snackStore = useSnackStore()

const AC = APPLICATION_CONSTANTS

const router = useRouter()
const route = useRoute()
const notebookId = route.params.notebookId
const noteId = route.params.noteId

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
const pageLoadError = ref<boolean>(false)
/** Same as Svelte NotePage: dirty when current text differs from last saved/loaded baseline. */
const isChanged = computed(() => viewText.value !== originalText.value)
const isCreate = ref<boolean>(new_note)
const isView = ref<boolean>(new_note)
const isSplitScreen = ref<boolean>(false)

const viewContainerRef = ref<HTMLElement | null>(null)
const noteShellLayout = computed<NoteShellLayout>(() =>
  isSplitScreen.value ? 'split' : isView.value ? 'view' : 'edit'
)

const prevNoteShellLayoutRef = ref<NoteShellLayout | null>(null)
const splitEnterFromRef = ref<'edit' | 'view' | null>(null)
const splitEnterSnapRef = ref<SplitEnterScrollSnap | null>(null)
const splitPostAlignTimeoutRef = ref<number | null>(null)
const splitStabilizeCleanupRef = ref<(() => void) | null>(null)
const prevIsSplitForScrollRef = ref(false)
const prevNoteShellLayoutScrollRef = ref<NoteShellLayout | null>(null)
let noteScrollEffectGeneration = 0

const windowDimensions = useWindowDimensions().value
windowDimensions.addListener()

onUnmounted(() => {
  removeScrollSync()
  windowDimensions.removeListener()
  if (splitPostAlignTimeoutRef.value !== null) {
    window.clearTimeout(splitPostAlignTimeoutRef.value)
  }
  splitStabilizeCleanupRef.value?.()
})

// Wait for the Markdown to load before initializing scroll sync
setTimeout(() => {
  initScrollSync()
}, 500)

watch(
  noteShellLayout,
  () => {
    const el = viewContainerRef.value
    const prev = prevNoteShellLayoutRef.value
    if (prev !== null && prev !== noteShellLayout.value) {
      commitNoteShellTransition(el, prev, noteShellLayout.value)
    }
    prevNoteShellLayoutRef.value = noteShellLayout.value
  },
  { flush: 'post' }
)

watch(
  [noteShellLayout, isSplitScreen],
  () => {
    const gen = ++noteScrollEffectGeneration

    const prevLayout = prevNoteShellLayoutScrollRef.value
    const editViewTransition =
      prevLayout !== null &&
      ((prevLayout === 'edit' && noteShellLayout.value === 'view') ||
        (prevLayout === 'view' && noteShellLayout.value === 'edit'))

    const wasSplit = prevIsSplitForScrollRef.value
    const leavingSplit = wasSplit && !isSplitScreen.value
    const enteringSplit = !wasSplit && isSplitScreen.value
    prevIsSplitForScrollRef.value = isSplitScreen.value

    if (leavingSplit || enteringSplit || editViewTransition) {
      detachScrollSyncListeners()
    }

    if (splitPostAlignTimeoutRef.value !== null) {
      window.clearTimeout(splitPostAlignTimeoutRef.value)
      splitPostAlignTimeoutRef.value = null
    }
    splitStabilizeCleanupRef.value?.()
    splitStabilizeCleanupRef.value = null

    const splitFrom = splitEnterFromRef.value
    const snapCaptured = splitEnterSnapRef.value

    requestAnimationFrame(() => {
      if (gen !== noteScrollEffectGeneration) return
      requestAnimationFrame(() => {
        if (gen !== noteScrollEffectGeneration) return

        if (!isSplitScreen.value) {
          if (leavingSplit) {
            const exitSettleMs = getNoteShellSplitTransitionCleanupMs() + 120
            splitPostAlignTimeoutRef.value = window.setTimeout(() => {
              if (gen !== noteScrollEffectGeneration) return
              splitPostAlignTimeoutRef.value = null
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (gen !== noteScrollEffectGeneration) return
                  splitEnterFromRef.value = null
                  initScrollSync()
                })
              })
            }, exitSettleMs)
            return
          }
          if (editViewTransition) {
            const settleMs = getNoteShellEditViewTransitionCleanupMs() + 120
            splitPostAlignTimeoutRef.value = window.setTimeout(() => {
              if (gen !== noteScrollEffectGeneration) return
              splitPostAlignTimeoutRef.value = null
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (gen !== noteScrollEffectGeneration) return
                  alignNotePanesScroll(noteShellLayout.value, null)
                  splitEnterFromRef.value = null
                  initScrollSync()
                })
              })
            }, settleMs)
            return
          }
          alignNotePanesScroll(noteShellLayout.value, null)
          splitEnterFromRef.value = null
          initScrollSync()
          return
        }

        const splitEnterWithOrigin = splitFrom !== null
        if (splitEnterWithOrigin) {
          splitEnterFromRef.value = null
        }

        if (splitEnterWithOrigin && snapCaptured) {
          splitEnterSnapRef.value = null
          const splitStabilizeMs = getNoteShellSplitTransitionCleanupMs() + 120
          splitStabilizeCleanupRef.value = stabilizeSplitEnterScroll(
            snapCaptured,
            splitStabilizeMs,
            () => {
              if (gen !== noteScrollEffectGeneration) return
              splitStabilizeCleanupRef.value = null
              initScrollSync()
            }
          )
          return
        }

        if (splitEnterWithOrigin) {
          splitPostAlignTimeoutRef.value = window.setTimeout(() => {
            if (gen !== noteScrollEffectGeneration) return
            splitPostAlignTimeoutRef.value = null
            alignNotePanesScroll('split', splitFrom)
            initScrollSync()
          }, getNoteShellSplitTransitionCleanupMs())
          return
        }

        alignNotePanesScroll('split', null)
        initScrollSync()
      })
    })
    prevNoteShellLayoutScrollRef.value = noteShellLayout.value
  },
  { flush: 'post' }
)

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

const showNoteSavedSnack = () => {
  snackStore.showSnack({ message: 'Note Saved' })
}

const emitApiError = (err: unknown, fromServer?: boolean) => {
  snackStore.showErrorSnack(normalizeErrorToString(err), {
    fromServer: fromServer === true
  })
}

const exampleNote = () => {
  if (!isMobile.value) {
    splitEnterSnapRef.value = captureSplitEnterScrollSnap(isView.value)
    splitEnterFromRef.value = isView.value ? 'view' : 'edit'
    isSplitScreen.value = true
  }
  updatedViewTextHandler(WELCOME_NOTE.value)
}

const updatedViewTextHandler = (updatedViewText: string) => {
  viewText.value = updatedViewText
  updateEditTextProp.value = updatedViewText
}

const persistNote = async (): Promise<boolean> => {
  if (!token || !notebookId || !noteId || noteId === 'create-note') {
    return false
  }
  try {
    const response = await saveNote(
      token,
      notebookId as string,
      noteId as string,
      viewText.value
    )
    if (response.error) {
      emitApiError(response.error, (response as { fromServer?: boolean }).fromServer)
      return false
    }
    if (response.success) {
      originalText.value = viewText.value
      return true
    }
  } catch (err) {
    emitApiError(err, false)
    return false
  }
  return false
}

// Create Note
const createNotePost = async () => {
  if (token && notebookId && viewText.value) {
    const note_obj = { notebookId: notebookId as string, note: viewText.value }
    try {
      const response = await createNote(token, note_obj)
      notebookLoaded.value = true
      if (response.error) {
        emitApiError(response.error, (response as { fromServer?: boolean }).fromServer)
        return
      }
      if (response.success) {
        isCreate.value = false
        router.push(`/notebook/${notebookId}`)
      }
    } catch (err) {
      emitApiError(err, false)
      return
    }
  }
}

const toggleEditHandlerCallback = () => {
  isView.value = !isView.value
}

const toggleSplitHandlerCallback = () => {
  if (!isSplitScreen.value) {
    splitEnterSnapRef.value = captureSplitEnterScrollSnap(isView.value)
    splitEnterFromRef.value = isView.value ? 'view' : 'edit'
  } else {
    splitEnterSnapRef.value = null
  }
  isSplitScreen.value = !isSplitScreen.value
}

useNoteShellSwipeNavigation(
  viewContainerRef,
  noteShellLayout,
  () => {
    toggleEditHandlerCallback()
  },
  () => {
    toggleEditHandlerCallback()
  }
)

const saveNoteCallback = async () => {
  const ok = await persistNote()
  if (!ok) return
  showNoteSavedSnack()
}

onBeforeRouteLeave(async (_to, _from, next) => {
  if (!isChanged.value || isCreate.value) {
    next()
    return
  }
  const ok = await persistNote()
  if (!ok) {
    next(false)
    return
  }
  showNoteSavedSnack()
  next()
})

const loadMarkdown = async () => {
  await fetch(`/markdown/welcome_markdown.md`)
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
        pageLoadError.value = true
        noteLoaded.value = true
        emitApiError(response.error, (response as { fromServer?: boolean }).fromServer)
        return
      }
      if (response.success) {
        viewText.value = response.note.note
        loadedText.value = response.note.note
        originalText.value = response.note.note
        noteLoaded.value = true
      }
    } catch (err) {
      pageLoadError.value = true
      noteLoaded.value = true
      emitApiError(err, false)
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
        pageLoadError.value = true
        emitApiError(response.error, (response as { fromServer?: boolean }).fromServer)
        return
      }
      if (response.success) {
        notebookEditStore.edited = response.notebook
      }
    } catch (err) {
      pageLoadError.value = true
      emitApiError(err, false)
      notebookLoaded.value = true
      return
    }
  }
}

const updateContext = (context: IAuthContext) => {
  token = context.token
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
  <div v-if="pageLoadError" class="page_scrollable_header_breadcrumb_footer loading_routes error-state">
    <p>Unable to load content.</p>
    <router-link class="back-link" :to="AC.DEFAULT_PAGE">Back to Notebooks</router-link>
  </div>
  <template v-else-if="!noteLoaded || token === null">
    <LoadingScreen />
  </template>

  <div v-else class="page_scrollable_header_breadcrumb_footer">
    <template v-if="noteLoaded && token !== null">
      <div
        ref="viewContainerRef"
        class="view_container"
        :class="{ editnote_box_split: isSplitScreen }"
        id="view_container"
        :data-note-layout="noteShellLayout"
      >
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
