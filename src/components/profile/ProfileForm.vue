<script setup lang="ts">
import { ref, toRef } from 'vue'
import type { AlertInterface, ProfileFormProps } from '@/core/model/global'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'
import { useSnackStore } from '@/stores/snack'

const snackStore = useSnackStore()

const AC = APPLICATION_CONSTANTS

const props = defineProps<ProfileFormProps>()

const userName = toRef(props, 'userName')

const oldPasswordRef = ref<HTMLInputElement | null>(null)
const newPasswordRef = ref<HTMLInputElement | null>(null)
const newUsernameRef = ref<HTMLInputElement | null>(null)

let onChangePassword = props.onChangePassword
let onChangeUsername = props.onChangeUsername

const userNameToggle = ref<boolean>(false)
const passwordToggle = ref<boolean>(false)
const formIsValid = ref<boolean>(false)
const error = ref<AlertInterface>({
  error_state: false,
  error_severity: '',
  message: ''
})

const resetError = () => {
  formIsValid.value = true
  error.value = {
    error_state: false,
    error_severity: '',
    message: ''
  }
}

const handleChangeUsername = (event: Event) => {
  resetError()
  const target = event.currentTarget! as HTMLInputElement
  if (target.value.length < AC.USERNAME_MIN || target.value === undefined) {
    formIsValid.value = false
    error.value = {
      error_state: true,
      error_severity: 'warning',
      message: AC.CHANGE_USER_TOO_FEW
    }
  } else if (target.value.length > AC.USERNAME_MAX) {
    formIsValid.value = false
    error.value = {
      error_state: true,
      error_severity: 'warning',
      message: AC.CHANGE_USER_TOO_MANY
    }
  } else if (target.value === userName.value) {
    formIsValid.value = false
    error.value = {
      error_state: true,
      error_severity: 'warning',
      message: AC.CHANGE_USER_UNIQUE
    }
  } else {
    resetError()
  }
}

const handleChangePassword = () => {
  resetError()
  const enteredOldPassword = oldPasswordRef.value?.value
  const enteredNewPassword = newPasswordRef.value?.value
  if (
    enteredOldPassword!.length < AC.PASSWORD_MIN ||
    enteredNewPassword!.length < AC.PASSWORD_MIN
  ) {
    formIsValid.value = false
    error.value = {
      error_state: true,
      error_severity: 'warning',
      message: AC.CHANGE_PASS_TOO_FEW
    }
  } else if (
    enteredOldPassword!.length > AC.PASSWORD_MAX ||
    enteredNewPassword!.length > AC.PASSWORD_MAX
  ) {
    formIsValid.value = false
    error.value = {
      error_state: true,
      error_severity: 'warning',
      message: AC.CHANGE_PASS_TOO_MANY
    }
  } else if (
    enteredOldPassword &&
    enteredNewPassword &&
    enteredOldPassword === enteredNewPassword
  ) {
    formIsValid.value = false
    error.value = {
      error_state: true,
      error_severity: 'warning',
      message: AC.CHANGE_PASS_UNIQUE
    }
  } else {
    resetError()
  }
}

const submitHandlerUsername = (event: Event) => {
  event.preventDefault()
  const enteredNewUsername = newUsernameRef.value?.value
  if (!enteredNewUsername) return
  onChangeUsername({
    newUsername: enteredNewUsername
  })
  resetToggle()
  showSnack('User name changed!')
}

const submitHandlerPassword = (event: Event) => {
  event.preventDefault()
  const enteredOldPassword = oldPasswordRef.value?.value
  const enteredNewPassword = newPasswordRef.value?.value
  if (!enteredOldPassword || !enteredNewPassword) {
    return
  }
  onChangePassword({
    oldPassword: enteredOldPassword,
    newPassword: enteredNewPassword
  })
  resetToggle()
  showSnack('Password changed!')
}

const showSnack = (msg: string) => {
  snackStore.ShowSnack({ n_status: true, message: msg })
}

const resetToggle = () => {
  resetError()
  userNameToggle.value = false
  passwordToggle.value = false
}

const toggleUserName = () => {
  resetError()
  userNameToggle.value = !userNameToggle.value
  passwordToggle.value = false
}

const togglePassword = () => {
  resetError()
  passwordToggle.value = !passwordToggle.value
  userNameToggle.value = false
}
</script>

<template>
  <div class="change_buttons">
    <v-btn
      mat-button
      color="secondary"
      aria-label="User Name button"
      class="contained medium"
      @click="toggleUserName"
    >
      User Name
    </v-btn>
    <v-btn
      mat-button
      color="secondary"
      aria-label="Password button"
      class="contained medium"
      @click="togglePassword"
    >
      Password
    </v-btn>
  </div>

  <template v-if="passwordToggle">
    <div class="form_container">
      <v-form class="form" @submit="submitHandlerPassword($event)">
        <div class="control">
          <label htmlFor="new-password">New Password</label>
          <input
            autoComplete="New Password"
            type="password"
            id="new-password"
            ref="newPasswordRef"
            @input="resetError"
            @blur="handleChangePassword"
          />
        </div>
        <div class="control">
          <label htmlFor="old-password">Old Password</label>
          <input
            autoComplete="New User Name"
            type="password"
            id="old-password"
            ref="oldPasswordRef"
            @input="resetError"
            @blur="handleChangePassword"
          />
        </div>
        <div class="action">
          <v-btn
            type="submit"
            color="secondary"
            aria-label="Change Password button"
            class="contained medium"
            :disabled="!formIsValid"
          >
            Change Password
          </v-btn>
        </div>
      </v-form>
    </div>
  </template>

  <template v-if="userNameToggle">
    <div class="form_container">
      <v-form class="form" @submit="submitHandlerUsername">
        <div class="control">
          <label htmlFor="new-username">User Name</label>
          <input
            :defaultValue="userName"
            type="text"
            id="new-password"
            ref="newUsernameRef"
            @input="handleChangeUsername($event)"
          />
        </div>
        <div class="action">
          <v-btn
            type="submit"
            color="secondary"
            aria-label="Change User Name button"
            class="contained medium"
            :disabled="!formIsValid"
          >
            Change User Name
          </v-btn>
        </div>
      </v-form>
    </div>
  </template>

  <template v-if="error.error_state">
    <ErrorAlert
      :error_severity="error.error_severity"
      :error_state="error.error_state"
      :message="error.message"
    />
  </template>
</template>

<style scoped>
.form {
  margin: 1.5rem auto;
}

.control {
  margin-bottom: 0.5rem;
}

.control label {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #353336;
  display: block;
}

.control input {
  display: block;
  font: inherit;
  width: 100%;
  border-radius: 4px;
  border: 1px solid #38015c;
  padding: 0.25rem;
  background-color: #f7f0fa;
}

.action {
  margin-top: 1.5rem;
}

.change_buttons {
  display: flex;
  flex-direction: row;
  align-content: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.form_container {
  display: flex;
  flex-direction: row;
  align-content: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}
</style>
