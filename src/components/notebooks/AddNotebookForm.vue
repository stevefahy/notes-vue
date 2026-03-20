<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { AlertInterface, NotebookAddEdit, NotebookCoverType } from '@/core/model/global'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'
import { FolderOptions } from '@/core/lib/folder-options'
import { mapLegacyCover } from '@/core/lib/folder-options'
import ErrorAlert from '../UI/ErrorAlert.vue'

const AC = APPLICATION_CONSTANTS

const props = defineProps<NotebookAddEdit>()

const error = ref<AlertInterface>({ error_state: false, message: '' })
const selectedCover = ref<NotebookCoverType>('forest')
const selectedName = ref<string>('')
const formChanged = ref<boolean>(false)
const isSubmitting = ref(false)

const covers = FolderOptions

const originalName = computed(() =>
  props.method === 'edit' && props.notebook ? props.notebook.notebook_name : ''
)
const originalCover = computed(() => {
  if (props.method === 'edit' && props.notebook) {
    return mapLegacyCover(props.notebook.notebook_cover) as NotebookCoverType
  }
  return 'forest'
})

watch(
  () => [selectedName.value, selectedCover.value],
  () => {
    if (props.method === 'create') {
      formChanged.value =
        selectedName.value.length >= AC.NOTEBOOK_NAME_MIN &&
        selectedName.value.length <= AC.NOTEBOOK_NAME_MAX
    } else {
      const hasChange =
        selectedName.value !== originalName.value ||
        selectedCover.value !== originalCover.value
      const nameValid =
        selectedName.value.length >= AC.NOTEBOOK_NAME_MIN &&
        selectedName.value.length <= AC.NOTEBOOK_NAME_MAX
      formChanged.value = hasChange && nameValid
    }
  }
)

if (props.method === 'edit' && props.notebook) {
  selectedName.value = props.notebook.notebook_name
  selectedCover.value = mapLegacyCover(props.notebook.notebook_cover) as NotebookCoverType
}

const resetError = () => {
  error.value = { error_state: false, message: '' }
}

const cancelHandler = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  resetError()
  closeWithAnimation()
  props.onCancel()
}

const submitHandler = async (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  if (!formChanged.value) return
  resetError()

  if (!selectedName.value || selectedName.value.length < AC.NOTEBOOK_NAME_MIN) {
    error.value = { error_state: true, message: AC.NOTEBOOK_NAME_MIN_ERROR }
    return
  }
  if (selectedName.value.length > AC.NOTEBOOK_NAME_MAX) {
    error.value = { error_state: true, message: AC.NOTEBOOK_NAME_MAX_ERROR }
    return
  }

  const notebook_name = selectedName.value
  const notebook_cover = selectedCover.value

  if (props.method === 'edit' && props.notebook && props.editNotebook) {
    const notebookId = props.notebook._id
    let updated = new Date().toISOString()
    if (props.notebook.updatedAt) updated = props.notebook.updatedAt
    isSubmitting.value = true
    try {
      const ok = await props.editNotebook(
        notebookId,
        notebook_name,
        notebook_cover,
        updated
      )
      if (ok) closeWithAnimation()
    } finally {
      isSubmitting.value = false
    }
  } else if (props.method === 'create' && props.addNotebook) {
    isSubmitting.value = true
    try {
      const ok = await props.addNotebook(notebook_name, notebook_cover)
      if (ok) closeWithAnimation()
    } finally {
      isSubmitting.value = false
    }
  }
}

const handleOverlayClick = (e: Event) => {
  if ((e.target as HTMLElement).classList.contains('sheet-overlay')) {
    cancelHandler(e)
  }
}

const visible = ref(props.open !== false)

const closeWithAnimation = () => {
  visible.value = false
}
const onAfterLeave = () => {
  // Transition complete; parent already updated via cancelHandler
}

const onAfterEnter = (el: Element) => {
  const input = (el as HTMLElement).querySelector<HTMLInputElement>('#new-notebook')
  if (input) input.focus()
}

watch(() => props.open, (val) => {
  visible.value = val !== false
  if (val) {
    resetError()
    if (props.method === 'edit' && props.notebook) {
      selectedName.value = props.notebook.notebook_name
      selectedCover.value = mapLegacyCover(props.notebook.notebook_cover) as NotebookCoverType
    } else {
      selectedName.value = ''
      selectedCover.value = 'forest'
    }
  }
})

</script>

<template>
  <Teleport to="body">
    <Transition name="sheet" :duration="{ enter: 380, leave: 300 }" @after-enter="onAfterEnter"
      @after-leave="onAfterLeave">
      <div v-if="visible" class="sheet-overlay" role="button" tabindex="0" aria-label="Close dialog"
        @click="handleOverlayClick" @keydown.enter="cancelHandler" @keydown.space.prevent="cancelHandler"
        @keydown.escape="cancelHandler">
        <div class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="add-notebook-title" tabindex="-1"
          @click.stop @keydown.escape="cancelHandler">
          <div class="sheet-handle" />
          <h2 id="add-notebook-title" class="sheet-title">
            {{ method === 'edit' ? 'Edit Notebook' : 'New Notebook' }}
          </h2>

          <form @submit.prevent="submitHandler">
            <div class="sheet-field">
              <label class="form-label" for="new-notebook">Name</label>
              <input id="new-notebook" v-model="selectedName" class="form-input" type="text"
                placeholder="e.g. Personal, Work…" :disabled="isSubmitting" />
            </div>

            <fieldset class="sheet-field sheet-fieldset">
              <legend class="form-label">Cover colour</legend>
              <div class="swatch-row">
                <button v-for="cover in covers" :key="cover.value" type="button"
                  :class="['swatch', `swatch-${cover.value}`, { selected: selectedCover === cover.value }]"
                  :aria-label="`${cover.viewValue} cover`" :aria-pressed="selectedCover === cover.value"
                  :disabled="isSubmitting" @click="selectedCover = cover.value" />
              </div>
            </fieldset>
          </form>

          <div v-if="error.error_state" class="sheet-field">
            <ErrorAlert :error_state="error.error_state" :message="error.message" />
          </div>

          <div class="sheet-actions">
            <button type="button" class="btn-cancel" aria-label="Cancel button" @click="cancelHandler">
              Cancel
            </button>
            <button type="button" class="btn-create" :disabled="!formChanged || isSubmitting"
              :aria-label="method === 'edit' ? 'Confirm edit button' : 'Create notebook button'" @click="submitHandler">
              {{
                isSubmitting
                  ? method === 'edit'
                    ? 'Saving…'
                    : 'Creating…'
                  : method === 'edit'
                    ? 'Confirm'
                    : 'Create'
              }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(8, 18, 12, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}

/* Match Svelte fly: bottom-sheet slides from y=400, 380ms enter (cubicOut), 300ms leave (cubicIn) */
.sheet-enter-active .bottom-sheet {
  transition: transform 380ms cubic-bezier(0.33, 1, 0.68, 1);
}

.sheet-leave-active .bottom-sheet {
  transition: transform 300ms cubic-bezier(0.32, 0, 0.67, 0);
}

.sheet-enter-from .bottom-sheet,
.sheet-leave-to .bottom-sheet {
  transform: translateY(400px);
}

.sheet-enter-to .bottom-sheet,
.sheet-leave-from .bottom-sheet {
  transform: translateY(0);
}

.bottom-sheet {
  background: var(--theme-surface);
  border-radius: 22px 22px 0 0;
  padding: 8px 0 32px;
  width: 100%;
  outline: none;
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.12);
}

@media (min-width: 768px) {
  .bottom-sheet {
    max-width: 420px;
  }
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: var(--theme-border-input);
  border-radius: 2px;
  margin: 8px auto 20px;
}

.sheet-title {
  font-family: var(--theme-font-serif);
  font-size: 18px;
  font-weight: 600;
  color: var(--theme-text);
  padding: 0 20px;
  margin: 0 0 18px;
}

.sheet-field {
  padding: 0 20px;
  margin-bottom: 14px;
}

.sheet-fieldset {
  border: none;
  margin: 0;
}

.bottom-sheet .form-label {
  display: block;
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--theme-text-secondary);
  margin-bottom: 6px;
}

.bottom-sheet .form-input {
  width: 100%;
  background: var(--theme-input-bg);
  border: 1.5px solid var(--theme-border-input);
  border-radius: var(--theme-radius-sm);
  padding: 11px 14px;
  font-family: var(--theme-font-sans);
  font-size: 14px;
  color: var(--theme-text);
  outline: none;
  box-sizing: border-box;
}

.bottom-sheet .form-input:focus {
  border-color: var(--theme-green);
  box-shadow: 0 0 0 3px rgba(46, 125, 82, 0.12);
}

.swatch-row {
  display: flex;
  gap: 10px;
  padding: 4px 0;
}

.swatch {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: box-shadow 0.15s ease;
}

.swatch-forest {
  background: var(--notebook-forest);
}

.swatch-emerald {
  background: var(--notebook-emerald);
}

.swatch-lime {
  background: var(--notebook-lime);
}

.swatch-sage {
  background: var(--notebook-sage);
}

.swatch.selected {
  box-shadow: 0 0 0 2.5px white, 0 0 0 4.5px var(--theme-green);
}

.sheet-actions {
  display: flex;
  gap: 10px;
  padding: 6px 20px 0;
  margin-top: 4px;
}

.btn-cancel {
  flex: 1;
  background: var(--theme-bg);
  color: var(--theme-text);
  border: 1px solid var(--theme-border-input);
  border-radius: var(--theme-radius-sm);
  padding: 13px;
  font-family: var(--theme-font-sans);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #e8f4ec;
}

.btn-create {
  flex: 1;
  background: var(--theme-green);
  color: white;
  border: none;
  border-radius: var(--theme-radius-sm);
  padding: 13px;
  font-family: var(--theme-font-sans);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--theme-shadow-btn);
}

.btn-create:hover:not(:disabled) {
  background: var(--theme-green-accent);
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
