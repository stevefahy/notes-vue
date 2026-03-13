<script setup lang="ts">
import { ref, watch } from 'vue'
import type { NotesProps } from '@/core/model/global'
import { extractNoteTitle, detectNoteTag } from '@/core/lib/noteCardUtils'
import ViewNoteThumb from '@/components/note/ViewNoteThumb.vue'
import DateFormat from '@/core/lib/date-format'
import { useEditNotesStore } from '@/stores/editNotes'

const props = defineProps<NotesProps>()

const editNotesStore = useEditNotesStore()

const isChecked = ref<Record<string, boolean>>({})
let prevClearNotesEdit = false

watch(
  () => props.onClearNotesEdit,
  (now) => {
    if (now && !prevClearNotesEdit) {
      isChecked.value = {}
      props.onNotesSelected?.({ selected: [] })
      editNotesStore.set(false, 0)
    }
    prevClearNotesEdit = !!now
  }
)

const updateCheckbox = (noteId: string, checked: boolean) => {
  isChecked.value = { ...isChecked.value, [noteId]: checked }
  const selected = Object.entries(isChecked.value)
    .filter(([, v]) => v)
    .map(([k]) => k)
  props.onNotesSelected?.({ selected })
  editNotesStore.set(!!props.onNotesEdit, selected.length)
}

const handleCardClick = (noteId: string) => {
  if (props.onNotesEdit) {
    updateCheckbox(noteId, !isChecked.value[noteId])
  }
}

const handleCardKeydown = (noteId: string, e: KeyboardEvent) => {
  if (props.onNotesEdit && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault()
    updateCheckbox(noteId, !isChecked.value[noteId])
  }
}

const getTagLabel = (tag: string) => {
  const labels: Record<string, string> = {
    todo: 'Todo',
    table: 'Table',
    code: 'Code',
    image: 'Image',
    list: 'List',
    text: 'Text',
    empty: 'Empty'
  }
  return labels[tag] ?? 'Empty'
}
</script>

<template>
  <div class="notebooks-list-wrap">
    <h2 class="page-heading">Your Notes</h2>
    <div class="notes-list-container">
      <ul class="notes_list">
        <li v-for="note in props.notes" :key="note._id" class="note-card-outer">
          <router-link v-if="!props.onNotesEdit" :to="`/notebook/${note.notebook}/${note._id}`"
            class="note-card-link-overlay" aria-label="Open note" />
          <div :role="props.onNotesEdit ? 'button' : undefined" :tabindex="props.onNotesEdit ? 0 : undefined"
            class="note-card-link" @click="props.onNotesEdit ? handleCardClick(note._id) : undefined"
            @keydown="props.onNotesEdit ? (e: KeyboardEvent) => handleCardKeydown(note._id, e) : undefined">
            <div class="note-card" :class="{ 'note-card--selected': isChecked[note._id] }">
              <div class="note-select-col-wrapper" :class="{ 'is-visible': props.onNotesEdit }">
                <div class="note-select-col" role="checkbox" :tabindex="props.onNotesEdit ? 0 : -1"
                  :aria-checked="!!isChecked[note._id]" @click.stop="handleCardClick(note._id)"
                  @keydown="handleCardKeydown(note._id, $event)">
                  <div class="sel-circle" :class="{ 'sel-circle--active': isChecked[note._id] }">
                    <svg v-if="isChecked[note._id]" width="10" height="8" viewBox="0 0 10 8" fill="none"
                      aria-hidden="true">
                      <path d="M1 4l3 3 5-6" stroke="white" stroke-width="1.6" stroke-linecap="round"
                        stroke-linejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              <div class="note-card-body">
                <div class="note-title">{{ extractNoteTitle(note.note) }}</div>
                <div class="note-thumb-preview">
                  <ViewNoteThumb :text="note.note" />
                </div>
                <div class="note-foot">
                  <span class="note-date">{{ DateFormat(note.updatedAt ?? '') }}</span>
                  <span :class="['note-tag', `tag-${detectNoteTag(note.note)}`]">
                    {{ getTagLabel(detectNoteTag(note.note)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.note-card--selected {
  border-color: var(--theme-green);
  box-shadow: 0 0 0 2px var(--theme-lime-light);
}
</style>
