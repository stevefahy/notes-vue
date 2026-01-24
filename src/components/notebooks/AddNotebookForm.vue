<script setup lang="ts">
import { ref, watch, computed } from 'vue'  // ← Added watch and computed
import { FolderOptions } from '@/core/lib/folder-options'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'
import type {
  AlertInterface,
  FolderOptionsInterface,
  NotebookAddEdit,
  NotebookCoverType
} from '@/core/model/global'
import ErrorAlert from '../UI/ErrorAlert.vue'
import { useMobileSizeStore } from '@/stores/mobileSize'
import { storeToRefs } from 'pinia'

const AC = APPLICATION_CONSTANTS

const mobileSizeStore = useMobileSizeStore()
const { btnSize } = storeToRefs(mobileSizeStore)

const props = defineProps<NotebookAddEdit>()

const error = ref<AlertInterface>({ error_state: false, message: '' })
const selectedCover = ref<NotebookCoverType>('default')
const selectedName = ref<string>('')
const formChanged = ref<boolean>(false)
const dialog = ref(true)

const folderOptions: FolderOptionsInterface[] = FolderOptions

// Compute original values for comparison (reactive)
const originalName = computed(() =>
  props.method === 'edit' && props.notebook
    ? props.notebook.notebook_name
    : ''
)
const originalCover = computed(() =>
  props.method === 'edit' && props.notebook
    ? props.notebook.notebook_cover
    : 'default'
)

// Initialize from props
if (props.method === 'edit' && props.notebook) {
  selectedName.value = props.notebook.notebook_name
  selectedCover.value = props.notebook.notebook_cover
}

const resetError = () => {
  error.value = {
    error_state: false,
    error_severity: '',
    message: ''
  }
}

// Watch for name changes and validate
watch(selectedName, (name) => {
  resetError()
  if (name !== originalName.value || selectedCover.value !== originalCover.value) {
    if (!name || name.length < AC.NOTEBOOK_NAME_MIN) {
      formChanged.value = false
      return
    }
    if (name.length > AC.NOTEBOOK_NAME_MAX) {
      formChanged.value = false
      error.value = {
        error_state: true,
        message: `${AC.NOTEBOOK_NAME_MAX_ERROR}`
      }
      return
    }
    formChanged.value = true
  } else {
    formChanged.value = false
  }
})

// Watch for cover changes
watch(selectedCover, (cover) => {
  if (
    selectedName.value !== originalName.value ||
    (selectedName.value !== '' && cover !== originalCover.value)
  ) {
    formChanged.value = true
  } else {
    formChanged.value = false
  }
})

const checkForm = () => {
  return !formChanged.value
}

const cancelHandler = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  error.value = { error_state: false, message: '' }
  dialog.value = false
  props.onCancel()
}

const submitHandler = async (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  error.value = { error_state: false, message: '' }

  if (!selectedName.value || selectedName.value.length < AC.NOTEBOOK_NAME_MIN) {
    error.value = {
      error_state: true,
      message: `${AC.NOTEBOOK_NAME_MIN_ERROR}`
    }
    return
  }
  if (selectedName.value.length > AC.NOTEBOOK_NAME_MAX) {
    error.value = {
      error_state: true,
      message: `${AC.NOTEBOOK_NAME_MAX_ERROR}`
    }
    return
  }
  if (!selectedCover.value || selectedCover.value.length === 0) {
    error.value = { error_state: true, message: AC.NOTEBOOK_COVER_EMPTY }
    return
  }

  const notebook_name = selectedName.value
  if (props.method === 'edit' && props.notebook && props.editNotebook) {
    const notebookId = props.notebook._id
    let updated = new Date().toISOString()
    if (props.notebook.updatedAt) {
      updated = props.notebook.updatedAt
    }
    props.editNotebook(notebookId, notebook_name, selectedCover.value, updated)
    dialog.value = false
    props.onCancel()
  } else if (props.method === 'create' && props.addNotebook) {
    props.addNotebook(notebook_name, selectedCover.value)
    dialog.value = false
    props.onCancel()
  }
}
</script>

<template>
  <v-dialog v-model="dialog" width="auto">
    <v-card>
      <v-card-text>
        <div class="dialogue_container">
          <h2 class="dialogue-title">
            {{ method === 'edit' ? 'Edit Notebook' : 'Add Notebook' }}
          </h2>
          <div>
            <form class="form">
              <div class="control">
                <label for="new-notebook">Name</label>
                <input type="text" id="new-notebook" v-model="selectedName" />
              </div>
              <div class="control">
                <label for="new-notebook-cover">Cover</label>
                <select name="cars" class="select_dialogue" id="new-notebook-cover" v-model="selectedCover">
                  <option v-for="folder of folderOptions" :key="folder.value" :value="folder.value">
                    {{ folder.viewValue }}
                  </option>
                </select>
              </div>
            </form>
            <div class="button_row">
              <div :class="checkForm() ? 'action_disabled' : 'action'">
                <div v-if="method === 'create'">
                  <v-btn :size="btnSize" color="secondary" aria-label="Add notebook button" class="contained medium"
                    :disabled="checkForm()" @click="submitHandler($event)">
                    Add
                  </v-btn>
                </div>
                <div v-if="method === 'edit'">
                  <v-btn :size="btnSize" color="secondary" aria-label="Edit notebook button" class="contained medium"
                    :disabled="checkForm()" @click="submitHandler($event)">
                    Confirm
                  </v-btn>
                </div>
              </div>
              <div>
                <v-btn :size="btnSize" color="secondary" aria-label="Cancel button" class="contained medium"
                  @click="cancelHandler($event)">
                  <span class="icon_text">
                    <span class="material-symbols-outlined button_icon white"> cancel </span>
                    Cancel
                  </span>
                </v-btn>
              </div>
            </div>
            <template v-if="error.error_state">
              <ErrorAlert :error_severity="error.error_severity" :error_state="error.error_state"
                :message="error.message" />
            </template>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.button_row {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.form {
  width: 100%;
  margin: 1rem auto;
}

.control {
  display: flex;
  margin-bottom: 0.5rem;
  flex-direction: row;
  align-items: flex-start;
  gap: 5px;
  flex-wrap: nowrap;
  width: 100%;
  justify-content: space-evenly;
}

.control label {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #353336;
  display: block;
}

.control input {
  display: block;
  font: inherit;
  max-width: 100%;
  width: 100%;
  border-radius: 4px;
  border: 1px solid #38015c;
  padding: 0.25rem;
  background-color: #f7f0fa;
}

.action,
.action_disabled {
  display: flex;
  justify-content: space-between;
}

.select_dialogue {
  width: 100%;
}

.dialogue_container {
  max-width: 300px;
}

@media only screen and (max-width: 380px) {
  .control {
    gap: 5px;
  }

  .control input {
    font-size: 0.7rem !important;
  }
}
</style>
