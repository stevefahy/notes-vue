<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { NotificationObject, NotificationStatus } from '@/core/model/global'
import { useRoute } from 'vue-router'
import MainNavigation from './MainNavigation.vue'
import NotificationView from './NotificationView.vue'
import SnackBar from '../UI/SnackBar.vue'
import { useNotificationStore } from '@/stores/notification'
import useWindowDimensions from '@/core/lib/useWindowDimension'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')

const windowDimensions = useWindowDimensions().value
windowDimensions.addListener()

onUnmounted(() => {
  windowDimensions.removeListener()
})

const notificationStore = useNotificationStore()

// Set the CSS variable --jsvh (Javascript Vertical Height)
// This var is used because on mobile browsers the css: calc(100vh)
// includes the browser address bar area.
const setScreenHeight = () => {
  const jsvh = window?.innerHeight ?? 0
  const headerEl = document?.getElementById('header_height')
  const headerHeight = headerEl?.getBoundingClientRect().height ?? 0
  if (document) {
    document.documentElement.style.setProperty('--jsvh', `${jsvh}px`)
    document.documentElement.style.setProperty('--jsheader-height', `${headerHeight}`)
  }
}

// Only run setScreenHeight when header exists (not on login page)
watch(
  () => route.name,
  (name) => {
    if (name !== 'login') {
      setTimeout(setScreenHeight, 0)
    }
  },
  { immediate: true }
)

onMounted(() => {
  const resizeHandler = () => {
    setScreenHeight()
  }
  window.addEventListener('resize', resizeHandler)
  onUnmounted(() => window.removeEventListener('resize', resizeHandler))
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
  <div class="app-shell">
    <MainNavigation v-if="!isLoginPage" />
    <main :class="{ 'login-page': isLoginPage }">
      <slot></slot>
    </main>
    <Transition name="notification">
      <template v-if="status">
        <NotificationView :n_status="notification!.notification.n_status" :title="notification!.notification.title"
          :message="notification!.notification.message" />
      </template>
    </Transition>
    <SnackBar />
  </div>
</template>

<style scoped>
main.login-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.notification-enter-active,
.notification-leave-active {
  transition: opacity 0.5s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
}
</style>
