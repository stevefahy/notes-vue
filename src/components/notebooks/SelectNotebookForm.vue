<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import type { SelectNotebookFormProps, Notebook, AlertInterface } from '@/core/model/global'
import { useMobileSizeStore } from '@/stores/mobileSize'
import { storeToRefs } from 'pinia'

const mobileSizeStore = useMobileSizeStore()
const { btnSize } = storeToRefs(mobileSizeStore)

const props = defineProps<SelectNotebookFormProps>()

const route = useRoute()

const dialog = true
const notebookId = route.params.notebookId

const selectedNotebook = ref<string>('')
const formIsValid = ref<boolean>(false)
const notebooksSorted = ref<Notebook[] | null>(null)
const error = ref<AlertInterface>({
  error_state: false,
  error_severity: '',
  message: ''
})

const findNotebook = (notebook_id: string) => {
  const index = props.notebooks.findIndex((x) => x._id === notebook_id)
  return props.notebooks[index]
}

const sortNotes = (notebooks: Notebook[]) => {
  // Add an update date for sorting if one does not exist
  notebooks.forEach((x) => {
    if (x.updatedAt === 'No date' || undefined) {
      x.updatedAt = 'December 17, 1995 03:24:00'
    }
    if (x.createdAt === 'No date' || undefined) {
      x.createdAt = 'December 17, 1995 03:24:00'
    }
  })
  notebooks
    .sort((a, b) => {
      if (a.updatedAt !== undefined && b.updatedAt !== undefined) {
        return new Date(a.updatedAt) > new Date(b.updatedAt) ? 1 : -1
      } else {
        return a.updatedAt !== undefined ? 1 : -1
      }
    })
    .reverse()
  return notebooks
}

const cancelHandler = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  if (error.value.error_state) {
    resetError()
  }
  props.onCancel()
}

const submitHandler = async (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  if (error.value.error_state) {
    resetError()
  }
  findNotebook(selectedNotebook.value)
  if (!selectedNotebook.value) {
    formIsValid.value = false
    return
  }
  props.moveNotes(selectedNotebook.value)
  props.onCancel()
}

const resetError = () => {
  formIsValid.value = true
  error.value = {
    error_state: false,
    error_severity: '',
    message: ''
  }
}

const handleChange = (event: Event) => {
  selectedNotebook.value = (event.target as HTMLSelectElement).value
  if ((event.target as HTMLSelectElement).value === 'default') {
    formIsValid.value = false
  } else {
    formIsValid.value = true
  }
}

if (props.notebooks) {
  let sorted = sortNotes(props.notebooks)
  notebooksSorted.value = sorted
}
</script>

<template>
  <v-dialog v-model="dialog" width="auto">
    <v-card>
      <v-card-text>
        <div class="dialogue_container">
          <h2 class="dialogue-title">Move to Notebook</h2>
          <form class="form">
            <div class="control">
              <label htmlFor="new-notebook-cover">Name</label>
              <select
                name="notebooks"
                id="notebooks"
                v-model="selectedNotebook"
                @change="handleChange($event)"
              >
                <option disabled value="">Select a notebook...</option>
                <template v-for="notebook of notebooksSorted">
                  <template v-if="notebook._id !== notebookId">
                    <option :key="notebook._id" :value="notebook._id">
                      {{ notebook.notebook_name }}
                    </option>
                  </template>
                </template>
              </select>
            </div>
          </form>
          <div class="button_row">
            <div class="action">
              <div class="move">
                <v-btn
                  :size="btnSize"
                  :disabled="!formIsValid"
                  color="secondary"
                  aria-label="Move Note button"
                  class="contained medium"
                  @click="submitHandler($event)"
                >
                  Move Note
                </v-btn>
              </div>
              <div class="cancel">
                <v-btn
                  :size="btnSize"
                  color="secondary"
                  aria-label="Cancel button"
                  class="contained medium"
                  @click="cancelHandler($event)"
                >
                  <span class="icon_text">
                    <span class="material-symbols-outlined button_icon white"> cancel </span>
                    Cancel
                  </span>
                </v-btn>
              </div>
            </div>
          </div>
          <template v-if="error.error_state">
            <ErrorAlert
              :error_severity="error.error_severity"
              :error_state="error.error_state"
              :message="error.message"
            />
          </template>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.button_row {
  width: 100%;
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
  justify-content: space-between;
  gap: 5px;
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
  width: 200px;
  border-radius: 4px;
  border: 1px solid #38015c;
  padding: 0.25rem;
  background-color: #f7f0fa;
}

.action {
  width: 100%;
  display: flex;
  justify-content: space-between;
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
