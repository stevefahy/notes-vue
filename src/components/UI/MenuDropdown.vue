<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'

const AC = APPLICATION_CONSTANTS

const authStore = useAuthStore()
const router = useRouter()

const open = ref(false)
const rippleKey = ref(0)

const success = computed(() => authStore.authContext?.success)

const toggleMenu = () => {
  open.value = !open.value
  rippleKey.value++
}

const handleProfile = () => {
  open.value = false
  router.push('/profile')
}

const loginHandler = () => {
  open.value = false
  router.push(AC.LOGIN_PAGE)
}

const handleLogout = () => {
  open.value = false
  const ctx = authStore.authContext
  if (ctx?.onLogout) ctx.onLogout()
}

const handleClickOutside = (e: Event) => {
  const target = e.target as Element
  if (open.value && target && !target.closest('.dropdown')) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="nav_menu">
    <div class="dropdown">
      <button type="button" class="icon profile-trigger" :class="{ 'is-active': open }" aria-haspopup="true"
        :aria-expanded="open" @click="toggleMenu" @keydown.escape="open = false">
        <span v-if="rippleKey > 0" :key="rippleKey" class="ripple-burst" />
        <span class="material-icons-outlined menu_item">person</span>
      </button>

      <Transition name="dropdown-slide">
        <div v-if="open" class="dropdown-menu" role="menu">
          <button v-if="success" type="button" class="dropdown-item" role="menuitem" @click="handleProfile">
            <span class="material-icons-outlined menu_item">person</span>
            Profile
          </button>
          <button v-if="!success" type="button" class="dropdown-item" role="menuitem" @click="loginHandler">
            <span class="material-symbols-outlined menu_item">login</span>
            Sign in
          </button>
          <button v-if="success" type="button" class="dropdown-item" role="menuitem" @click="handleLogout">
            <span class="material-symbols-outlined menu_item danger_icon">logout</span>
            Sign out
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.nav_menu {
  padding-right: 16px;
}
</style>
