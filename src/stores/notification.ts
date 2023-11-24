import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { NotificationObject } from '@/core/model/global'

export const useNotificationStore = defineStore('notification', () => {
  const initialState: NotificationObject = {
    notification: {
      n_status: null,
      title: null,
      message: null
    }
  }

  const notification = ref(initialState)

  const ShowNotification = (param: NotificationObject) => {
    notification.value = param
  }

  return { ShowNotification, notification }
})
