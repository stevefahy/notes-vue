<script setup lang="ts">
import { computed } from 'vue'
import UserProfile from '@/components/profile/UserProfile.vue'
import ProfileForm from '@/components/profile/ProfileForm.vue'
import { useAuthStore } from '@/stores/auth'
import { changeUsername, changePassword } from '@/core/helpers'

const authStore = useAuthStore()

const details = computed(() => authStore.authContext.details)
const userName = computed(() => details.value?.username ?? undefined)
const token = computed(() => authStore.authContext.token ?? '')

const handleChangeUsername = async (arg: { newUsername: string }) => {
  const result = await changeUsername(token.value, arg)
  if (result.error) {
    throw new Error(result.error)
  }
  if (result.details) {
    authStore.authContext.details = result.details
  }
}

const handleChangePassword = async (arg: {
  oldPassword: string | undefined
  newPassword: string | undefined
}) => {
  const result = await changePassword(token.value, arg)
  if (result.error) {
    throw new Error(result.error)
  }
}
</script>

<template>
  <div class="profile-page">
    <UserProfile :details="details" />
    <ProfileForm :user-name="userName" :on-change-username="handleChangeUsername"
      :on-change-password="handleChangePassword" />
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
}
</style>
