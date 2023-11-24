import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ButtonSize } from '@/core/model/global'

export const useMobileSizeStore = defineStore('mobileSize', () => {
  const btnSize = ref<ButtonSize>('default')

  return { btnSize }
})
