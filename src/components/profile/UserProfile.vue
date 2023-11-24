<script setup lang="ts">
import { ref } from 'vue'
import type { IAuthContext, IAuthDetails } from '@/core/model/global'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { changePassword, changeUsername } from '@/core/helpers'
import ProfileForm from './ProfileForm.vue'

const notificationStore = useNotificationStore()
const authStore = useAuthStore()

const loading = ref<boolean | null>(null)
const token = ref<string | null>()
const success = ref<boolean | null>()
const details = ref<IAuthDetails | null>()
let onLogout: () => void

const updateContext = (context: IAuthContext) => {
  loading.value = context.loading
  token.value = context.token
  success.value = context.success
  details.value = context.details
  onLogout = context.onLogout
}

authStore.$subscribe((mutation, state) => {
  updateContext(state.authContext)
})

const showNotification = (msg: string) => {
  notificationStore.ShowNotification({
    notification: { n_status: 'error', title: 'Error!', message: msg }
  })
}

const changePasswordHandler = async (passwordData: {}) => {
  if (token.value) {
    try {
      const response = await changePassword(token.value, passwordData)
      if (response.error) {
        showNotification(`${response.error}`)
        return
      }
    } catch (err) {
      showNotification(`${err}`)
      return
    }
  }
}

const changeUsernameHandler = async (passwordData: {}) => {
  if (token.value) {
    try {
      const response = await changeUsername(token.value, passwordData)
      if (response.error) {
        showNotification(`${response.error}`)
        return
      }
      if (response.error === 'Unauthorized') {
        if (onLogout) {
          onLogout()
        }
        return
      }
      if (response.success) {
        const prev = { ...authStore.authContext }
        authStore.authContext = {
          ...prev,
          success: response.success,
          details: response.details,
          loading: false
        }
      }
    } catch (err) {
      showNotification(`${err}`)
      return
    }
  }
}

const getAuth = async () => {
  const authContext = await authStore.getAuth()
  if (authContext.value !== null) {
    updateContext(authContext.value)
  }
}

getAuth()
</script>

<template>
  <div class="page_scrollable_header_breadcrumb_list">
    <template v-if="!success"><LoadingScreen /></template>
    <template v-if="success && !token">Unauthorized</template>
    <template v-if="success && token && details">
      <section class="profile">
        <h2>{{ details.username }}</h2>
        <h3>{{ details.email }}</h3>
        <ProfileForm
          :userName="details.username"
          :onChangePassword="changePasswordHandler"
          :onChangeUsername="changeUsernameHandler"
        />
      </section>
    </template>
  </div>
</template>

<style scoped>
.profile {
  margin: 3rem auto;
  text-align: center;
  display: flex;
  overflow-y: visible;
  flex-direction: column;
  align-items: center;
}
</style>
