<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import MainNavigation from './MainNavigation.vue'
import SnackBar from '../UI/SnackBar.vue'
import useWindowDimensions from '@/core/lib/useWindowDimension'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')

const windowDimensions = useWindowDimensions().value
windowDimensions.addListener()

onUnmounted(() => {
  windowDimensions.removeListener()
})

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

</script>

<template>
  <div class="app-shell">
    <MainNavigation v-if="!isLoginPage" />
    <main :class="{ 'login-page': isLoginPage }">
      <slot></slot>
    </main>
    <SnackBar />
  </div>
</template>

<style scoped>
main.login-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
</style>
