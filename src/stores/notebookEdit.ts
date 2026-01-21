import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Edited } from '@/core/model/global'

export const useNotebookEditStore = defineStore('notebookEdit', () => {
  const editing = ref<boolean>()
  const edited = ref<Edited>()

  return { editing, edited }
})
