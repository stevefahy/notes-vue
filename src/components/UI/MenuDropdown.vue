<script setup lang="ts">
import type { IAuthDetails, IAuthContext } from '@/core/model/global'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'

const AC = APPLICATION_CONSTANTS

const authStore = useAuthStore()
const router = useRouter()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loading: boolean | null
let success: boolean | null
let details: IAuthDetails | null
let onLogout: () => void

authStore.$subscribe((mutation, state) => {
  updateContext(state.authContext)
})

const updateContext = (context: IAuthContext) => {
  loading = context.loading
  success = context.success
  details = context.details
  onLogout = context.onLogout
}

const handleProfile = async (event: Event) => {
  event.preventDefault()
  router.push(`/profile`)
}

const loginHandler = async (event: Event) => {
  event.preventDefault()
  router.push(`${AC.LOGIN_PAGE}`)
}
</script>

<template>
  <div class="nav_menu">
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn
          fab
          variant="text"
          size="small"
          class="icon more_vert"
          v-bind="props"
          icon="more_vert"
        >
          <v-icon fab>more_vert</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item
          v-if="success && details"
          prepend-icon="account_circle"
          @click="handleProfile($event)"
        >
          <v-list-item-title>{{ details.username }}</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="success" prepend-icon="settings" @click="handleProfile($event)">
          <v-list-item-title>Settings</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="!success" prepend-icon="login" @click="loginHandler($event)">
          <v-list-item-title>Login</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="success" prepend-icon="logout" @click="onLogout()">
          <v-list-item-title>logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<style scoped>
.icon {
  color: white !important;
}

.icon .material-icons {
  color: white;
}

.icon i.material-icons {
  color: white;
}

.icon .v-btn__content .material-icons {
  color: white !important;
}

.icon span .material-icons {
  color: white !important;
}

.nav_menu {
  padding-right: 16px;
}
</style>
