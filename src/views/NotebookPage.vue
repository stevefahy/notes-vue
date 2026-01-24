<script setup lang="ts">
import { ref } from 'vue'
import type { Note, Notebook, SelectedNote, IAuthContext } from '@/core/model/global'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
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
import { useRouter, useRoute } from 'vue-router'
import FooterView from '@/components/layout/FooterView.vue'
import NoteList from '@/components/notebook/NoteList.vue'
import AddNotebookForm from '@/components/notebooks/AddNotebookForm.vue'
import SelectNotebookForm from '@/components/notebooks/SelectNotebookForm.vue'
import { useMobileSizeStore } from '@/stores/mobileSize'
import { storeToRefs } from 'pinia'

const mobileSizeStore = useMobileSizeStore()
const { btnSize } = storeToRefs(mobileSizeStore)

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
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

const showNotification = (msg: string) => {
  notificationStore.ShowNotification({
    notification: { n_status: 'error', title: 'Error!', message: msg }
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
        showNotification(`${response.error}`)
        return
      }
      if (response.success) {
        const notes_sorted = sortNotes(response.notes)
        notes.value = notes_sorted
        notesLoadedDelay.value = true
      }
    } catch (err) {
      showNotification(`${err}`)
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
        showNotification(`${response.error}`)
        return
      }
      if (response.success) {
        notebook.value = response.notebook
        notebookEditStore.edited = response.notebook
      }
    } catch (err) {
      showNotification(`${err}`)
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
        showNotification(`${response.error}`)
        return
      }
      if (response.success) {
        userNotebooks.value = response.notebooks
      }
    } catch (err) {
      showNotification(`${err}`)
      notebooksLoaded.value = true
      return
    }
  }
}

const updateSelected = (selected: SelectedNote) => {
  isSelected.value = selected
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
}

const resetNotesSelected = () => {
  let newarray: SelectedNote = { selected: [] }
  isSelected.value = {
    ...isSelected,
    selected: newarray.selected
  }
}

const cancelEditNoteFormHandler = () => {
  editNotes.value = false
  clearEditNotes.value = true
  resetNotesSelected()
}

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
        showNotification(`${response.error}`)
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
            let nID = String(notebookId)
            updateNotebookDate(nID, updatedNotesLatestDate)
          }
        }
        cancelEditNoteFormHandler()
      }
    } catch (err) {
      showNotification(`${err}`)
      return
    }
  }
}

const editNotebookDateHandler = async (notebookID: string, notebookUpdated: string) => {
  if (token && notebookID && notebookUpdated) {
    try {
      const response = await editNotebookDate(token, notebookID, notebookUpdated)
      if (response.error) {
        showNotification(`${response.error}`)
        return
      }
    } catch (err) {
      showNotification(`${err}`)
      return
    }
  }
}

const deleteNotebookHandler = async () => {
  const notebook_id = notebook.value!._id
  if (token && notebook_id && notebook_id.length > 0) {
    try {
      const response = await deleteNotebook(token, notebook_id)
      if (response.error) {
        showNotification(`${response.error}`)
        return
      }
      if (response.success) {
        router.push(`/notebooks`)
      }
    } catch (err) {
      showNotification(`${err}`)
      return
    }
  }
}

const editNotebookHandler = async (
  notebookID: string,
  notebookName: string,
  notebookCover: string,
  notebookUpdated: string
) => {
  if (token && notebookID && notebookName && notebookCover && notebookUpdated) {
    try {
      const response = await editNotebook(
        token,
        notebookID,
        notebookName,
        notebookCover,
        notebookUpdated
      )
      if (response.error) {
        showNotification(`${response.error}`)
        return
      }
      if (response.success) {
        notebook.value = response.notebook_edited
        enableEditNotebook.value = false
        notebookEditStore.editing = false
        notebookEditStore.edited = response.notebook_edited
      }
    } catch (err) {
      showNotification(`${err}`)
      return
    }
  }
}

const getLatestUpdated = (selected: string[]) => {
  let found_notes = []
  for (const i in selected) {
    if (notes.value !== null) {
      var result = notes.value!.filter((obj) => {
        return obj._id === selected[i]
      })
      found_notes.push(result[0])
    }
  }
  let selected_notes = sortNotes(found_notes)
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
        showNotification(`${response.error}`)
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
          let nID = String(notebookId)
          updateNotebookDate(nID, updatedNotesLatestDate)
        }
        // Close the dialog
        moveNote.value = false
        // Reset
        cancelEditNoteFormHandler()
      }
    } catch (err) {
      showNotification(`${err}`)
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
  <template v-if="!notebookLoaded || !notesLoaded">
    <LoadingScreen />
  </template>

  <div class="page_scrollable_header_breadcrumb_footer_list">
    <template v-if="notebookLoaded && notesLoaded && notebook && notes">
      <template v-if="notesLoaded && notebook && notes !== null">
        <NoteList :notes="notes" :onNotesSelected="updateSelected" :onNotesEdit="editNotes"
          :onClearNotesEdit="clearEditNotes" />
      </template>
      <template v-if="moveNote && userNotebooks">
        <SelectNotebookForm :notebooks="userNotebooks" :moveNotes="moveNoteHandler" :onCancel="cancelHandler" />
      </template>
      <template v-if="enableEditNotebook">
        <AddNotebookForm method="edit" :notebook="notebook" :editNotebook="editNotebookHandler"
          :onCancel="cancelEditHandler" />
      </template>
    </template>
  </div>
  <FooterView>
    <template v-if="notebookLoaded && notesLoaded && !editNotes">
      <v-btn :size="btnSize" rounded="xl" color="secondary" aria-label="Add note button"
        class="contained medium breadcrumb_edit_fab button_fab" @click="addNoteFormHandler">
        <span class="icon_text">
          <span class="material-symbols-outlined button_icon white"> note_add </span>
          Add Note
        </span>
      </v-btn>
    </template>
    <template v-if="notebookLoaded && notesLoaded && !editNotes && notes && notes!.length > 0">
      <v-btn :size="btnSize" rounded="xl" color="secondary" aria-label="Edit Notes button"
        class="contained medium breadcrumb_edit_fab button_fab" @click="editNoteFormHandler">
        <span class="icon_text">
          <span class="material-symbols-outlined button_icon white"> edit </span>
          Edit Notes
        </span>
      </v-btn>
    </template>

    <template v-if="notebookLoaded && notesLoaded && notes && notes!.length < 1">
      <v-btn :size="btnSize" rounded="xl" color="secondary" aria-label="Delete Notebook button"
        class="contained medium breadcrumb_edit_fab button_fab" @click="deleteNotebookHandler">
        <span class="icon_text">
          <span class="material-symbols-outlined button_icon white"> delete </span>
          Delete Notebook
        </span>
      </v-btn>
    </template>
    <template v-if="
      notebookLoaded && notesLoaded && editNotes && isSelected && isSelected!.selected.length > 0
    ">
      <v-btn rounded="xl" :size="btnSize" color="secondary" aria-label="Delete Note button"
        class="contained medium breadcrumb_edit_fab button_fab" @click="deleteNoteHandler">
        <span class="icon_text">
          <span class="material-symbols-outlined button_icon white"> delete </span>
          Delete
        </span>
      </v-btn>
      <template v-if="userNotebooks && userNotebooks!.length > 1">
        <v-btn :size="btnSize" rounded="xl" color="secondary" aria-label="Move Note button"
          class="contained medium breadcrumb_edit_fab button_fab" @click="moveNoteFormHandler">
          <span class="icon_text">
            <span class="material-symbols-outlined button_icon white symbol_size">
              flip_to_front
            </span>
            Move
          </span>
        </v-btn>
      </template>
    </template>
    <template v-if="notebookLoaded && notesLoaded && editNotes">
      <v-btn :size="btnSize" rounded="xl" color="secondary" aria-label="Cancel Note button"
        class="contained medium breadcrumb_edit_fab button_fab" @click="cancelEditNoteFormHandler">
        <span class="icon_text">
          <span class="material-symbols-outlined button_icon white"> cancel </span>
          Cancel
        </span>
      </v-btn>
    </template>
  </FooterView>
</template>
