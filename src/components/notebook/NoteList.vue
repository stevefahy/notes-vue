<script setup lang="ts">
import { watch, ref } from 'vue'
import type { NotesProps, Note, CheckedNote, SelectedNote } from '@/core/model/global'
import ViewNoteThumb from '../note/ViewNoteThumb.vue'
import DateFormat from '@/core/lib/date-format'

const props = defineProps<NotesProps>()

const dateFormat = DateFormat

const userNotes = ref<Note[]>(props.notes)
const isChecked = ref<CheckedNote[]>([])
const isSelected = ref<SelectedNote>({ selected: [] })

const inputRefs = ref<Record<string, HTMLInputElement>>({})

watch(isSelected, (newVal) => {
  props.onNotesSelected(newVal)
})

if (props.notes) {
  const props_notes = props.notes
  if (props_notes) {
    // Set the initial notes array
    userNotes.value = props_notes
    let newarray: CheckedNote[] = []
    props_notes.forEach((note) => {
      // Set the checkboxes initial value to false
      let newnote = { id: note._id, selected: false }
      newarray.push(newnote)
      return newarray
    })
    isChecked.value = newarray
  }
}

const updateCheckbox = (checked_id: string, checked: boolean) => {
  const prev = [...isChecked.value]
  let newarray: CheckedNote[] = prev
  const is = isChecked.value?.findIndex((x) => x.id === checked_id)
  if (is >= 0 && newarray.length > 0) {
    newarray[is].selected = checked
  }
  isChecked.value = newarray
  let newarrayS: SelectedNote = { selected: [] }
  isChecked.value?.forEach((x) => {
    if (x.selected) {
      newarrayS.selected.push(x.id)
    }
  })
  isSelected.value = newarrayS
}

const checkboxStatus = (event: Event) => {
  const target = event.currentTarget! as HTMLInputElement
  const { checked } = target
  const checked_id = target.value
  updateCheckbox(checked_id, checked)
}

const divStatus = (id: any) => {
  const target: HTMLInputElement = inputRefs.value[id]
  let { checked } = target
  const checked_id = target.value
  target.checked = !checked
  checked = target.checked
  updateCheckbox(checked_id, checked)
}

const NoteLinkHandler = (event: Event) => {
  if (props.onNotesEdit) {
    event.preventDefault()
  }
}

const EditLinkHandler = (noteid: string) => {
  if (props.onNotesEdit) {
    divStatus(noteid)
  }
}
</script>

<template v-if="userNotes">
  <ul class="notes_list">
    <li class="notebook_list_bg" v-for="note in userNotes" :key="note._id">
      <div class="thumb_outer">
        <router-link @click="NoteLinkHandler" :to="'/notebook/' + note.notebook + '/' + note._id"
          class="thumb_outer_link">
          <div class="thumb_outer_link">
            <div :id="note._id" class="edit_link" @click="EditLinkHandler(note._id)">
              <v-card class="note_list_card">
                <v-card-text class="cardcontent">
                  <div class="thumb_image">
                    <ViewNoteThumb :text="note.note" />
                  </div>
                  <div class="date_format date_format_notes">
                    {{ dateFormat(note.updatedAt!) }}
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </router-link>
        <template v-if="onNotesEdit">
          <div class="thumb_select_outer">
            <div class="thumb_select">
              <input :ref="el => { if (el) inputRefs[note._id] = el as HTMLInputElement }" :id="`input_${note._id}`"
                type="checkbox" name="Status" :value="note._id" @change="checkboxStatus($event)" />
            </div>
          </div>
        </template>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.cardcontent {
  padding: 0 16px !important;
}

.notes_list {
  list-style: none;
  margin-block-start: 0em;
  padding-inline-start: 0px;
  padding-left: 10px;
  padding-right: 10px;
  margin-bottom: 16px;
}

.notes_list li {
  padding-top: 10px;
}

.notebook_list_bg {
  position: relative;
}

.thumb_select {
  position: absolute;
  right: 10px;
  top: 15px;
  z-index: 1000;
}

.thumb_select_outer {
  position: absolute;
  width: 100%;
  height: 100%;
}

.note_list_card:hover {
  background-color: #f7f7f7;
}

.thumb_image {
  min-height: calc(var(--viewnotethumb-box-min-height) * 1px);
  min-height: 45px;
  max-height: 300px;
  overflow-y: hidden;
  width: 100%;
  padding: 0;
  margin: 0;
}

.thumb_outer_link {
  cursor: pointer;
  width: 100%;
}

.thumb_outer {
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: flex-start;
  min-height: 81px;
}

.thumb_outer a {
  width: 100%;
}

.thumb_outer .edit_link {
  width: 100%;
}
</style>
