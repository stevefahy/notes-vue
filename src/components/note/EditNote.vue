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
  <div id="edit" :class="{
    'edit editnote_box': true,
    'show editting': props.visible
  }">
    <v-card>
      <v-card-text>
        <article class="viewnote_content editor">
          <div ref="noteInputRef" :contentEditable="props.visible || props.splitScreen"
            class="viewnote_content editable" @input="setText($event)" data-placeholder="Start writing...'"></div>
        </article>
      </v-card-text>
    </v-card>
  </div>
</template>
