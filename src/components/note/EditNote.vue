<script setup lang="ts">
import { ref, watch, onMounted, toRef } from 'vue'
import type { NoteEditor } from '@/core/model/global'

const props = defineProps<NoteEditor>()

const noteInputRef = ref<HTMLDivElement | null>(null)

const passUpdatedViewText = toRef(props, 'passUpdatedViewText')

watch(passUpdatedViewText, (val) => {
  if (noteInputRef.value) {
    const current_edit_text = noteInputRef.value.innerText
    if (current_edit_text !== val) {
      noteInputRef.value.innerText = val
    }
  }
})

onMounted(() => {
  if (props.loadedText === '' && noteInputRef.value) {
    noteInputRef.value.focus()
  }

  if (props.loadedText && noteInputRef.value) {
    noteInputRef.value.innerText = props.loadedText
  }
})

const setText = (event: Event) => {
  props.updateViewText((event.currentTarget as HTMLDivElement).innerText)
}
</script>

<template>
  <div id="edit" class="note-pane note-pane--edit edit editnote_box">
    <div class="note-pane-scroll">
      <div class="edit-note">
        <div class="note-card">
          <article class="v-card-text viewnote_content editor">
            <div
              ref="noteInputRef"
              :contentEditable="props.visible || props.splitScreen"
              class="viewnote_content editable"
              role="textbox"
              @input="setText($event)"
              data-placeholder="Start writing..."
            ></div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-card {
  background: transparent;
  border: none;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
}

.edit-note {
  min-width: 0;
  width: 100%;
}

.viewnote_content.editable {
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
}
</style>
