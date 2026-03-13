import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useEditNotesStore = defineStore('editNotes', () => {
  const active = ref(false)
  const selectedCount = ref(0)

  function set(activeVal: boolean, count: number) {
    active.value = activeVal
    selectedCount.value = count
  }

  function clear() {
    active.value = false
    selectedCount.value = 0
  }

  const showPill = computed(() => active.value && selectedCount.value > 0)

  return { active, selectedCount, set, clear, showPill }
})
