import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Snack, SnackVariant } from '@/core/model/global'
import { toUserFriendlyError } from '@/core/lib/error-message-map'

export type ShowSnackOptions = {
  message: string
  variant?: SnackVariant
}

export type ShowErrorSnackOptions = {
  fromServer?: boolean
}

export const useSnackStore = defineStore('snack', () => {
  const initialState: Snack = {
    n_status: false,
    message: '',
    variant: 'success'
  }

  const snack = ref<Snack>({ ...initialState })

  const showSnack = (opts: ShowSnackOptions) => {
    snack.value = {
      n_status: true,
      message: opts.message,
      variant: opts.variant ?? 'success'
    }
  }

  const showErrorSnack = (message: string, options?: ShowErrorSnackOptions) => {
    const display = options?.fromServer === true ? message : toUserFriendlyError(message)
    showSnack({ message: display, variant: 'error' })
  }

  const resetSnack = () => {
    snack.value = { ...initialState }
  }

  /** @deprecated Prefer showSnack / showErrorSnack */
  const ShowSnack = (param: Snack) => {
    if (param.n_status && param.message) {
      snack.value = {
        n_status: true,
        message: param.message,
        variant: param.variant ?? 'success'
      }
    } else {
      resetSnack()
    }
  }

  return { ShowSnack, showSnack, showErrorSnack, resetSnack, snack }
})
