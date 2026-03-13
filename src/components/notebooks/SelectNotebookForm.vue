<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SelectNotebookFormProps } from '@/core/model/global'
import { mapLegacyCover } from '@/core/lib/folder-options'

const props = defineProps<SelectNotebookFormProps>()

const selectedNotebook = ref<string>('')

const formIsValid = computed(
  () => selectedNotebook.value !== '' && selectedNotebook.value !== 'default'
)

const notebooksFiltered = computed(() => {
  const copy = [...props.notebooks]
  copy.sort((a, b) => {
    const aDate =
      a.updatedAt === 'No date' || !a.updatedAt ? 'December 17, 1995' : a.updatedAt
    const bDate =
      b.updatedAt === 'No date' || !b.updatedAt ? 'December 17, 1995' : b.updatedAt
    return new Date(aDate) > new Date(bDate) ? -1 : 1
  })
  return copy.filter((n) => n._id !== props.currentNotebookId)
})

const visible = ref(props.open !== false)
const closeWithAnimation = () => {
  visible.value = false
}
const onAfterLeave = () => {
  props.onCancel()
}

watch(() => props.open, (val) => {
  visible.value = val !== false
})

const cancelHandler = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  closeWithAnimation()
}

const submitHandler = async (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  if (!selectedNotebook.value || !formIsValid.value) return
  props.moveNotes(selectedNotebook.value)
  closeWithAnimation()
}

const handleOverlayClick = (e: Event) => {
  if ((e.target as HTMLElement).classList.contains('sheet-overlay')) {
    cancelHandler(e)
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') cancelHandler(e as unknown as Event)
  if (e.key === 'Enter' || e.key === ' ') {
    if ((e.target as Element).closest('.bottom-sheet')) return
    e.preventDefault()
    cancelHandler(e as unknown as Event)
  }
}

const getDisplayCover = (cover: string) => mapLegacyCover(cover)
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet" :duration="{ enter: 380, leave: 300 }" @after-leave="onAfterLeave">
      <div v-if="visible" class="sheet-overlay" role="button" tabindex="0" aria-label="Close dialog"
        @click="handleOverlayClick" @keydown="handleKeydown">
        <div class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="move-notebook-title" @click.stop>
          <div class="sheet-handle" />
          <h2 id="move-notebook-title" class="sheet-title">Move to Notebook</h2>

          <div class="sheet-field">
            <span class="form-label" id="notebook-options-label">Notebook</span>
            <div class="notebook-options" role="listbox" aria-labelledby="notebook-options-label">
              <button v-for="nb in notebooksFiltered" :key="nb._id" type="button" class="notebook-option"
                :class="{ selected: selectedNotebook === nb._id }" role="option"
                :aria-selected="selectedNotebook === nb._id" @click="selectedNotebook = nb._id">
                <span :class="['option-cover', `option-cover-${getDisplayCover(nb.notebook_cover)}`]">
                  <span :class="['nb-spine', `nb-spine-${getDisplayCover(nb.notebook_cover)}`]" />
                </span>
                <span class="option-name">{{ nb.notebook_name }}</span>
              </button>
            </div>
          </div>

          <div class="sheet-actions">
            <button type="button" class="btn-cancel" aria-label="Cancel button" @click="closeWithAnimation">
              Cancel
            </button>
            <button type="button" class="btn-move" :disabled="!formIsValid" aria-label="Move Note button"
              @click="submitHandler">
              Move Note
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

.form-label {
  display: block;
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--theme-text-secondary);
  margin-bottom: 6px;
}

.notebook-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px 0;
}

.notebook-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  background: var(--theme-input-bg);
  border: 1.5px solid var(--theme-border-input);
  border-radius: var(--theme-radius-sm);
  font-family: var(--theme-font-sans);
  font-size: 14px;
  color: var(--theme-text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.notebook-option:hover {
  border-color: var(--theme-green);
}

.notebook-option.selected {
  border-color: var(--theme-green);
  box-shadow: 0 0 0 2px rgba(46, 125, 82, 0.2);
}

.option-cover {
  width: 24px;
  min-width: 24px;
  height: 28px;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.option-cover-forest {
  background: var(--notebook-forest);
}

.option-cover-emerald {
  background: var(--notebook-emerald);
}

.option-cover-lime {
  background: var(--notebook-lime);
}

.option-cover-sage {
  background: var(--notebook-sage);
}

.nb-spine {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.nb-spine-forest {
  background: var(--notebook-emerald-color);
}

.nb-spine-emerald {
  background: var(--notebook-lime-color);
}

.nb-spine-lime {
  background: var(--notebook-sage-color);
}

.nb-spine-sage {
  background: var(--notebook-forest-color);
}

.option-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.btn-move {
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

.btn-move:hover:not(:disabled) {
  background: var(--theme-green-accent);
}

.btn-move:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
