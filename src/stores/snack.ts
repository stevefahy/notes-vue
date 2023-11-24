import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Snack } from '@/core/model/global'

export const useSnackStore = defineStore('snack', () => {
  const initialState: Snack = {
    n_status: false,
    message: ''
  }

  const snack = ref(initialState)

  const ShowSnack = (param: Snack) => {
    snack.value = param
  }

  return { ShowSnack, snack }
})
