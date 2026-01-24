<script setup lang="ts">
import { ref } from 'vue'
import type { Ref } from 'vue'
import type { AlertInterface, IAuthContext, onLoginT, onRegisterT } from '../core/model/global'
import APPLICATION_CONSTANTS from '../core/application-constants/application-constants'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const AC = APPLICATION_CONSTANTS

const isLogin = ref(true)
const isSubmitting = ref(false)

// Keep template refs only for focusing (optional - can be removed if not needed)
const usernameInputRef: Ref<HTMLInputElement | undefined> = ref(undefined)
const emailInputRef: Ref<HTMLInputElement | undefined> = ref(undefined)
const passwordInputRef: Ref<HTMLInputElement | undefined> = ref(undefined)

const username = ref<string>('')
const email = ref<string>('')
const password = ref<string>('')

const error: Ref<AlertInterface> = ref({
  error_state: false,
  error_severity: '',
  message: ''
})

let onLogin: onLoginT
let onRegister: onRegisterT

const updateContext = (context: IAuthContext) => {
  onLogin = context.onLogin
  onRegister = context.onRegister
}

updateContext(authStore.authContext)

const switchAuthModeHandler = () => {
  resetError()
  isLogin.value = !isLogin.value
  // Clear form when switching modes
  username.value = ''
  email.value = ''
  password.value = ''
}

const resetError = () => {
  error.value = { error_state: false, message: '' }
  isSubmitting.value = false
}

const validateForm = (validate: string[]) => {
  if (validate.includes('username')) {
    const enteredUsername = username.value
    if (enteredUsername && enteredUsername.length < 2) {
      usernameInputRef.value?.focus()
      error.value = { error_state: true, message: AC.SIGNUP_INVALID_USERNAME }
      return false
    }
  }
  if (validate.includes('email')) {
    const enteredEmail = email.value
    if (!enteredEmail || !enteredEmail.includes('@') || !enteredEmail.includes('.')) {
      emailInputRef.value?.focus()
      error.value = { error_state: true, message: AC.SIGNUP_INVALID_EMAIL }
      return false
    }
  }
  if (validate.includes('password')) {
    const enteredPassword = password.value
    if (!enteredPassword || enteredPassword.trim().length < 7) {
      passwordInputRef.value?.focus()
      error.value = { error_state: true, message: AC.SIGNUP_INVALID_PASSWORD }
      return false
    }
  }
  return true
}

const submitHandler = async (event: Event) => {
  event.preventDefault()
  isSubmitting.value = true
  error.value = { error_state: false, message: '' }
  const enteredEmail = email.value
  const enteredPassword = password.value

  if (isLogin.value) {
    // Existing user
    const validForm = validateForm(['email', 'password'])
    if (!validForm) {
      return
    }
    try {
      if (!enteredEmail || !enteredPassword) {
        return
      }
      const result = await onLogin(enteredEmail, enteredPassword)
      isSubmitting.value = false
      if (!result?.error) {
        // Navigate the default page.
        router.push(`${APPLICATION_CONSTANTS.DEFAULT_PAGE}`)
      } else {
        error.value = { error_state: true, message: result.error }
      }
    } catch (error: any) {
      error.value = { error_state: true, message: error.message }
    }
  } else {
    // New User
    const enteredUsername = username.value
    const validForm = validateForm(['username', 'email', 'password'])
    if (!validForm) {
      return
    }
    try {
      if (!enteredUsername || !enteredEmail || !enteredPassword) {
        return
      }
      const result = await onRegister(enteredUsername, enteredEmail, enteredPassword, 'angular')
      isSubmitting.value = false
      if (result === null || result === undefined) {
        return
      }
      if (result.error) {
        error.value = { error_state: true, message: result.error }
        return
      }
      if (result.success && result.notebookID && result.noteID) {
        router.push(`/notebook/${result.notebookID}/${result.noteID}`)
      } else {
        router.push(`${APPLICATION_CONSTANTS.DEFAULT_PAGE}`)
      }
    } catch (error: any) {
      error.value = { error_state: true, message: error.message }
    }
  }
}
</script>

<template>
  <section class="auth">
    <v-card>
      <v-card-title class="header">{{ isLogin ? 'Login' : 'Sign Up' }}</v-card-title>
      <v-card-text>
        <form novalidate>
          <div v-if="!isLogin">
            <div class="control">
              <label for="username">Your Name</label>
              <input type="text" id="username" required placeholder="Username" autoComplete="username"
                v-model="username" @input="resetError" ref="usernameInputRef" />
            </div>
          </div>
          <div class="control">
            <label for="email">Your Email</label>
            <input type="email" id="email" required placeholder="Email" autoComplete="email" v-model="email"
              @change="resetError()" @input="resetError()" ref="emailInputRef" />
          </div>

          <div class="control">
            <label for="password">Your Password</label>
            <input type="password" id="password" required placeholder="Password" autoComplete="current-password"
              v-model="password" @change="resetError()" @input="resetError()" ref="passwordInputRef" />
          </div>
          <div class="actions">
            <v-btn class="contained medium" color="secondary" @click="submitHandler" :disabled="isSubmitting">
              {{ isLogin ? 'Login' : 'Create Account' }}
            </v-btn>
            <v-btn variant="text" density="default" class="basic large" @click="switchAuthModeHandler()">
              {{ isLogin ? 'Create new account' : 'Login with existing account' }}
            </v-btn>
          </div>
        </form>

        <Transition name="error">
          <template v-if="error.error_state">
            <error-alert :error_state="error.error_state" :message="error.message"
              :error_severity="error.error_severity"></error-alert>
          </template>
        </Transition>
      </v-card-text>
    </v-card>
  </section>
</template>

<style scoped>
.auth {
  margin: 3rem auto;
  width: 95%;
  max-width: 25rem;
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
}

.auth h1 {
  text-align: center;
}

.control {
  margin-bottom: 0.5rem;
}

.control label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.actions {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.actions button {
  cursor: pointer;
}

.header {
  margin: 0px;
  font-family: Roboto, Helvetica, Arial, sans-serif;
  font-weight: 400;
  font-size: 1.5rem;
  line-height: 1.334;
  letter-spacing: 0em;
  display: block;
  padding: 16px;
}

.error-enter-active,
.error-leave-active {
  transition: opacity 0.5s ease;
}

.error-enter-from,
.error-leave-to {
  opacity: 0;
}
</style>
