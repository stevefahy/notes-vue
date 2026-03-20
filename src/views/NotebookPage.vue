<script setup lang="ts">
import { ref } from 'vue'
import type { Note, Notebook, SelectedNote, IAuthContext } from '@/core/model/global'
import { useAuthStore } from '@/stores/auth'
import { useSnackStore } from '@/stores/snack'
import { useNotebookEditStore } from '@/stores/notebookEdit'
import {
  getNotebook,
  getNotes,
  getNotebooks,
  deleteNotes,
  editNotebookDate,
  deleteNotebook,
  editNotebook,
  moveNotes
} from '@/core/helpers'
import { normalizeErrorToString } from '@/core/lib/error-message-map'
import { useRouter, useRoute } from 'vue-router'
import FooterView from '@/components/layout/FooterView.vue'
import NoteList from '@/components/notebook/NoteList.vue'
import AddNotebookForm from '@/components/notebooks/AddNotebookForm.vue'
import SelectNotebookForm from '@/components/notebooks/SelectNotebookForm.vue'
import { useEditNotesStore } from '@/stores/editNotes'
import { onUnmounted } from 'vue'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'

const AC = APPLICATION_CONSTANTS

const editNotesStore = useEditNotesStore()

const authStore = useAuthStore()
const snackStore = useSnackStore()
const notebookEditStore = useNotebookEditStore()

authStore.$subscribe((mutation, state) => {
  updateContext(state.authContext)
})

notebookEditStore.$subscribe((mutation, state) => {
  if (state.editing) {
    editNotebookBtnHandler()
  }
})

const router = useRouter()
const route = useRoute()

const notebookId = route.params.notebookId

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loading: boolean | null
let token: string | null

const notes = ref<Note[] | null>(null)
const notesLoadedDelay = ref(false)
const notesLoaded = ref(false)
const notebookLoaded = ref(false)
const pageLoadError = ref(false)
const notebooksLoaded = ref<boolean>(false)
const notebook = ref<Notebook | null>(null)
const userNotebooks = ref<Notebook[] | null>(null)
const isSelected = ref<SelectedNote | null>(null)
const moveNote = ref(false)
const enableEditNotebook = ref(false)
const editNotes = ref(false)
const clearEditNotes = ref(false)

let loadingTimer: ReturnType<typeof setTimeout>

const init = () => {
  if (notesLoadedDelay.value) {
    loadingTimer = setTimeout(() => {
      notesLoaded.value = true
      clearTimeout(loadingTimer)
    }, 100)
  }

  if (!notesLoaded.value) {
    loadNotes()
  }

  if (!notebookLoaded.value) {
    loadNotebook()
  }

  if (!notebooksLoaded.value) {
    loadNotebooks()
  }
}

const updateContext = (context: IAuthContext) => {
  loading = context.loading
  token = context.token
}

const emitApiError = (err: unknown, fromServer?: boolean) => {
  snackStore.showErrorSnack(normalizeErrorToString(err), {
    fromServer: fromServer === true
  })
}

const sortNotes = (notes: Note[]) => {
  // Add an update date for sorting if one does not exist
  notes.forEach((x) => {
    if (x.updatedAt === 'No date' || undefined) {
      x.updatedAt = 'December 17, 1995 03:24:00'
    }
  })
  notes
    .sort((a, b) => {
      if (a.updatedAt !== undefined && b.updatedAt !== undefined) {
        return new Date(a.updatedAt) > new Date(b.updatedAt) ? 1 : -1
      } else {
        return a.updatedAt !== undefined ? 1 : -1
      }
    })
    .reverse()
  return notes
}

const loadNotes = async () => {
  if (!notesLoaded.value && token && notebookId) {
    notesLoadedDelay.value = false
    notesLoaded.value = false
    try {
      const response = await getNotes(token, notebookId as string)
      notesLoaded.value = true
      if (response.error) {
        pageLoadError.value = true
        emitApiError(response.error, (response as { fromServer?: boolean }).fromServer)
        return
      }
      if (response.success) {
        const notes_sorted = sortNotes(response.notes)
        notes.value = notes_sorted
        notesLoadedDelay.value = true
      }
    } catch (err) {
      pageLoadError.value = true
      emitApiError(err, false)
      notesLoadedDelay.value = true
      return
    }
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
        notebook.value = response.notebook
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

const loadNotebooks = async () => {
  if (!notebooksLoaded.value && token) {
    notebooksLoaded.value = false
    try {
      const response = await getNotebooks(token)
      notebooksLoaded.value = true
      if (response.error) {
        emitApiError(response.error, (response as { fromServer?: boolean }).fromServer)
        return
      }
      if (response.success) {
        userNotebooks.value = response.notebooks
      }
    } catch (err) {
      emitApiError(err, false)
      notebooksLoaded.value = true
      return
    }
  }
}

const updateSelected = (selected: SelectedNote) => {
  isSelected.value = selected
  editNotesStore.set(editNotes.value, selected?.selected?.length ?? 0)
}

const moveNoteFormHandler = () => {
  moveNote.value = true
}

const cancelHandler = () => {
  moveNote.value = false
}

const cancelEditHandler = () => {
  enableEditNotebook.value = false
  notebookEditStore.editing = false
}

const editNotebookBtnHandler = () => {
  enableEditNotebook.value = true
}

const addNoteFormHandler = () => {
  router.push(`/notebook/${notebookId}/create-note`)
}

const editNoteFormHandler = () => {
  editNotes.value = true
  clearEditNotes.value = false
  editNotesStore.set(true, 0)
}

const resetNotesSelected = () => {
  const newarray: SelectedNote = { selected: [] }
  isSelected.value = {
    ...isSelected,
    selected: newarray.selected
  }
}

const cancelEditNoteFormHandler = () => {
  editNotes.value = false
  clearEditNotes.value = true
  resetNotesSelected()
  editNotesStore.clear()
}

onUnmounted(() => {
  editNotesStore.clear()
})

const updateNotebookDate = (notebookId: string, notebookLatesDate: string) => {
  editNotebookDateHandler(notebookId, notebookLatesDate)
}

const deleteNoteHandler = async () => {
  let notesSelected: string[]
  if (
    token &&
    isSelected.value !== null &&
    isSelected.value !== undefined &&
    isSelected.value?.selected !== null
  ) {
    notesSelected = isSelected.value!.selected
    try {
      const response = await deleteNotes(token, notesSelected)
      notebookLoaded.value = true
      if (response.error) {
        emitApiError(response.error, (response as { fromServer?: boolean }).fromServer)
        return
      }
      if (response.success) {
        let updatedNotesLatestDate: string | undefined
        const NotesLatestDate: string | undefined = notes.value![0].updatedAt

        let i = isSelected.value.selected.length
        if (i && i > 0 && notes.value) {
          while (i--) {
            const objWithIdIndex = notes.value.findIndex(
              (obj) => obj._id === isSelected.value!.selected[i]
            )
            if (objWithIdIndex >= 0) {
              notes.value.splice(objWithIdIndex, 1)
            }
          }
        }
        if (notes.value && notes.value.length > 0) {
          updatedNotesLatestDate = notes.value[0].updatedAt
        }
        if (updatedNotesLatestDate !== undefined && notebookId !== undefined && NotesLatestDate) {
          if (new Date(updatedNotesLatestDate).getTime() !== new Date(NotesLatestDate).getTime()) {
            const nID = String(notebookId)
            updateNotebookDate(nID, updatedNotesLatestDate)
          }
        }
        cancelEditNoteFormHandler()
      }
    } catch (err) {
      emitApiError(err, false)
      return
    }
  }
}

const editNotebookDateHandler = async (notebookID: string, notebookUpdated: string) => {
  if (token && notebookID && notebookUpdated) {
    try {
      const response = await editNotebookDate(token, notebookID, notebookUpdated)
      if (response.error) {
        emitApiError(response.error, (response as { fromServer?: boolean }).fromServer)
        return
      }
    } catch (err) {
      emitApiError(err, false)
      return
    }
  }
}

const deleteNotebookHandler = async () => {
  if (!navigator.onLine) {
    snackStore.showErrorSnack(AC.ERROR_NETWORK, { fromServer: false })
    return
  }
  const notebook_id = notebook.value!._id
  if (token && notebook_id && notebook_id.length > 0) {
    try {
      const response = await deleteNotebook(token, notebook_id)
      if (response.error) {
        emitApiError(response.error, (response as { fromServer?: boolean }).fromServer)
        return
      }
      if (response.success) {
        router.push(`/notebooks`)
      }
    } catch (err) {
      emitApiError(err, false)
      return
    }
  }
}

const editNotebookHandler = async (
  notebookID: string,
  notebookName: string,
  notebookCover: string,
  notebookUpdated: string
): Promise<boolean> => {
  if (!token || !notebookID || !notebookName || !notebookCover || !notebookUpdated) {
    return false
  }
  try {
    const response = await editNotebook(
      token,
      notebookID,
      notebookName,
      notebookCover,
      notebookUpdated
    )
    if (response.error) {
      emitApiError(response.error, (response as { fromServer?: boolean }).fromServer)
      return false
    }
    if (response.success) {
      notebook.value = response.notebook_edited
      enableEditNotebook.value = false
      notebookEditStore.editing = false
      notebookEditStore.edited = response.notebook_edited
      return true
    }
  } catch (err) {
    emitApiError(err, false)
    return false
  }
  return false
}

const getLatestUpdated = (selected: string[]) => {
  const found_notes = []
  for (const i in selected) {
    if (notes.value !== null) {
      const result = notes.value!.filter((obj) => {
        return obj._id === selected[i]
      })
      found_notes.push(result[0])
    }
  }
  const selected_notes = sortNotes(found_notes)
  return selected_notes[0].updatedAt
}

const moveNoteHandler = async (notebookID: string) => {
  let notesSelected: string[]
  if (
    token &&
    notebookID &&
    isSelected.value !== null &&
    isSelected.value !== undefined &&
    isSelected.value?.selected !== null
  ) {
    notesSelected = isSelected.value!.selected
    const latestUpdatedDate = getLatestUpdated(notesSelected)
    try {
      const response = await moveNotes(token, notebookID, notesSelected, latestUpdatedDate)
      if (response.error) {
        emitApiError(response.error, (response as { fromServer?: boolean }).fromServer)
        return
      }
      if (response.success) {
        let updatedNotesLatestDate: string | undefined
        // update the notes array to delete the notes from state
        let i = isSelected.value.selected.length
        if (i && i > 0 && notes.value) {
          while (i--) {
            const objWithIdIndex = notes.value.findIndex(
              (obj) => obj._id === isSelected.value!.selected[i]
            )
            if (objWithIdIndex >= 0) {
              notes.value.splice(objWithIdIndex, 1)
            }
          }
        }
        if (notes.value && notes.value.length > 0) {
          updatedNotesLatestDate = notes.value[0].updatedAt
        }
        if (updatedNotesLatestDate !== undefined && notebookId !== undefined) {
          const nID = String(notebookId)
          updateNotebookDate(nID, updatedNotesLatestDate)
        }
        // Close the dialog
        moveNote.value = false
        // Reset
        cancelEditNoteFormHandler()
      }
    } catch (err) {
      emitApiError(err, false)
      return
    }
  }
}

const getAuth = async () => {
  const auth = await authStore.getAuth()
  if (auth.value !== null) {
    updateContext(auth.value)
    init()
  }
}

getAuth()
</script>

<template>
  <div v-if="pageLoadError" class="page_scrollable_header_breadcrumb_footer_list loading_routes error-state">
    <p>Unable to load content.</p>
    <router-link class="back-link" :to="AC.DEFAULT_PAGE">Back to Notebooks</router-link>
  </div>
  <template v-else-if="!notebookLoaded || !notesLoaded">
    <LoadingScreen />
  </template>

  <div v-else class="page_scrollable_header_breadcrumb_footer_list">
    <template v-if="notebookLoaded && notesLoaded && notebook && notes">
      <template v-if="notesLoaded && notebook && notes !== null">
        <NoteList :notes="notes" :onNotesSelected="updateSelected" :onNotesEdit="editNotes"
          :onClearNotesEdit="clearEditNotes" />
      </template>
      <SelectNotebookForm v-if="userNotebooks" :open="!!(moveNote && userNotebooks)" :notebooks="userNotebooks"
        :currentNotebookId="(notebookId as string)" :moveNotes="moveNoteHandler" :onCancel="cancelHandler" />
      <AddNotebookForm :open="enableEditNotebook" method="edit" :notebook="notebook" :editNotebook="editNotebookHandler"
        :onCancel="cancelEditHandler" />
    </template>
  </div>
  <FooterView>
    <div v-if="notebookLoaded && notesLoaded" class="nb-footer-row">
      <template v-if="!editNotes">
        <button v-if="notes && notes.length > 0" type="button" class="btn-action-ghost" aria-label="Edit Notes button"
          @click="editNoteFormHandler">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="media_query_size">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Notes
        </button>
        <button type="button" class="btn-action-primary" aria-label="Add note button" @click="addNoteFormHandler">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="media_query_size">
            <path d="M6 1v10M1 6h10" stroke="white" stroke-width="2" stroke-linecap="round" />
          </svg>
          Add Note
        </button>
        <button v-if="notes && notes.length < 1" type="button" class="btn-action-danger"
          aria-label="Delete Notebook button" @click="deleteNotebookHandler">
          <span class="icon_text">
            <span class="material-symbols-outlined button_icon danger">delete</span>
            Delete Notebook
          </span>
        </button>
      </template>
      <template v-else>
        <button v-if="isSelected && isSelected.selected.length > 0" type="button" class="btn-action-danger"
          aria-label="Delete Note button" @click="deleteNoteHandler">
          <span class="icon_text">
            <span class="material-symbols-outlined button_icon danger media_query_size">delete</span>
            Delete
          </span>
        </button>
        <button v-if="isSelected && isSelected.selected.length > 0 && userNotebooks && userNotebooks.length > 1"
          type="button" class="btn-action-ghost" aria-label="Move Note button" @click="moveNoteFormHandler">
          <span class="icon_text">
            <span class="material-symbols-outlined button_icon green symbol_size media_query_size">flip_to_front</span>
            Move to…
          </span>
        </button>
        <button type="button" class="btn-action-ghost" aria-label="Cancel Note button"
          @click="cancelEditNoteFormHandler">
          <span class="icon_text">
            <span class="material-symbols-outlined button_icon green media_query_size">cancel</span>
            Cancel
          </span>
        </button>
      </template>
    </div>
  </FooterView>
</template>
