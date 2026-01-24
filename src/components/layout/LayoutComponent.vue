<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import type { NotificationObject, NotificationStatus, ButtonSize } from '@/core/model/global'
import MainNavigation from './MainNavigation.vue'
import NotificationView from './NotificationView.vue'
import SnackBar from '../UI/SnackBar.vue'
import { useNotificationStore } from '@/stores/notification'
import { useMobileSizeStore } from '@/stores/mobileSize'
import useWindowDimensions from '@/core/lib/useWindowDimension'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'

const AC = APPLICATION_CONSTANTS

const mobileSizeStore = useMobileSizeStore()

const windowDimensions = useWindowDimensions().value
windowDimensions.addListener()

let width: number = windowDimensions.width

onUnmounted(() => {
  windowDimensions.removeListener()
})

const btnSize = ref<ButtonSize>('default')

const dimensionsChange = () => {
  if (width < AC.MOBILE_LAYOUT_WIDTH) {
    btnSize.value = 'small'
  } else {
    btnSize.value = 'default'
  }
  mobileSizeStore.btnSize = btnSize.value
}

watch(windowDimensions, (newVal) => {
  width = newVal.width
  dimensionsChange()
})

dimensionsChange()

const notificationStore = useNotificationStore()

// Set the CSS variable --jsvh (Javascript Vertical Height)
// This var is used because on mobile browsers the css: calc(100vh)
// includes the browser address bar area.
// In the /styles/global.css
// height: calc(100vh - var(--header-footer-height));
// becomes:
// height: calc(var(--jsvh) - var(--header-footer-height));
const setScreenHeight = () => {
  let jsvh = window && window.innerHeight
  let header_height =
    document && document.getElementById('header_height')?.getBoundingClientRect().height
  document && document.documentElement.style.setProperty('--jsvh', `${jsvh}px`)
  document && document.documentElement.style.setProperty('--jsheader-height', `${header_height}`)
}

// Set the initial screenHeight
setTimeout(() => {
  setScreenHeight()
}, 0)

// Set the screenHeight on window resize (includes orientation change)
window &&
  window.addEventListener('resize', () => {
    setScreenHeight()
  })

const status = ref<NotificationStatus>(null)
const notification = ref<NotificationObject | null>(null)


let timer_notification: ReturnType<typeof setTimeout>
notificationStore.$subscribe((mutation, state) => {
  const res = state.notification
  status.value = res.notification.n_status
  if (status.value !== null) {
    notification.value = res
    timer_notification = setTimeout(() => {
      status.value = null
      clearTimeout(timer_notification)
    }, 5000)
  }
})
</script>

<template>
  <MainNavigation />
  <main>
    <slot></slot>
  </main>
  <Transition name="notification">
    <template v-if="status">
      <NotificationView :n_status="notification!.notification.n_status" :title="notification!.notification.title"
        :message="notification!.notification.message" />
    </template>
  </Transition>
  <SnackBar />
</template>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: opacity 0.5s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
}
</style>
