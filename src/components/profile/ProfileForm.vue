<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProfileFormProps } from '@/core/model/global'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'
import { useSnackStore } from '@/stores/snack'
import {
  normalizeErrorToString,
  toUserFriendlyError
} from '@/core/lib/error-message-map'

const AC = APPLICATION_CONSTANTS

const props = defineProps<ProfileFormProps>()

const snackStore = useSnackStore()

const newUsername = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const isSubmitting = ref(false)
const usernameServerError = ref('')
const passwordServerError = ref('')
const activeTab = ref<'user' | 'pass'>('user')

const usernameError = computed(() => {
  const len = newUsername.value.length
  if (len === 0) return ''
  if (len > AC.USERNAME_MAX) return `Too long — max ${AC.USERNAME_MAX} characters`
  if (newUsername.value.trim() === props.userName) return 'Same as your current username'
  if (newUsername.value.trim().length < AC.USERNAME_MIN)
    return `At least ${AC.USERNAME_MIN} characters required`
  return ''
})

const usernameValid = computed(
  () =>
    newUsername.value.length > 0 &&
    newUsername.value.length <= AC.USERNAME_MAX &&
    newUsername.value.trim() !== props.userName &&
    newUsername.value.trim().length >= AC.USERNAME_MIN
)

const usernameTooltip = computed(
  () =>
    usernameError.value ||
    (newUsername.value.length === 0 ? 'Enter a new username to save' : '')
)

const passwordError = computed(() => {
  if (!newPassword.value || !oldPassword.value) return ''
  if (newPassword.value === oldPassword.value)
    return 'Must differ from your current password'
  if (newPassword.value.length < AC.PASSWORD_MIN)
    return `At least ${AC.PASSWORD_MIN} characters required`
  if (newPassword.value.length > AC.PASSWORD_MAX)
    return `Max ${AC.PASSWORD_MAX} characters`
  return ''
})

const passwordValid = computed(
  () =>
    !!oldPassword.value &&
    !!newPassword.value &&
    newPassword.value !== oldPassword.value &&
    newPassword.value.length >= AC.PASSWORD_MIN &&
    newPassword.value.length <= AC.PASSWORD_MAX
)

const passwordTooltip = computed(
  () =>
    passwordError.value ||
    (!oldPassword.value || !newPassword.value ? 'Fill in both fields to continue' : '')
)

const strengthScore = computed(() => {
  let s = 0
  if (newPassword.value.length >= AC.PASSWORD_MIN) s++
  if (/[A-Z]/.test(newPassword.value)) s++
  if (/[0-9]/.test(newPassword.value)) s++
  if (/[^A-Za-z0-9]/.test(newPassword.value)) s++
  return s
})

const strengthClass = computed(() =>
  strengthScore.value <= 1 ? 'weak' : strengthScore.value <= 2 ? 'ok' : 'good'
)

const handleChangeUsername = async (e: Event) => {
  e.preventDefault()
  if (!usernameValid.value || !props.onChangeUsername) return
  isSubmitting.value = true
  usernameServerError.value = ''
  try {
    const result = await props.onChangeUsername({ newUsername: newUsername.value.trim() })
    if (result?.error) {
      const rawMsg = normalizeErrorToString(result.error)
      usernameServerError.value =
        result.fromServer === true ? rawMsg : toUserFriendlyError(rawMsg)
    } else {
      newUsername.value = ''
      snackStore.showSnack({ message: 'User name changed!' })
    }
  } catch (err) {
    usernameServerError.value = toUserFriendlyError(err)
  } finally {
    isSubmitting.value = false
  }
}

const handleChangePassword = async (e: Event) => {
  e.preventDefault()
  if (!passwordValid.value || !props.onChangePassword) return
  isSubmitting.value = true
  passwordServerError.value = ''
  try {
    const result = await props.onChangePassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value
    })
    if (result?.error) {
      const rawMsg = normalizeErrorToString(result.error)
      passwordServerError.value =
        result.fromServer === true ? rawMsg : toUserFriendlyError(rawMsg)
    } else {
      oldPassword.value = ''
      newPassword.value = ''
      snackStore.showSnack({ message: 'Password updated' })
    }
  } catch (err) {
    passwordServerError.value = toUserFriendlyError(err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="pf-outer">
    <div class="tab-container">
      <div class="tabs">
        <button type="button" class="tab" :class="{ active: activeTab === 'user' }" @click="activeTab = 'user'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Username
        </button>
        <button type="button" class="tab" :class="{ active: activeTab === 'pass' }" @click="activeTab = 'pass'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Password
        </button>
      </div>

      <div class="tab-panel">
        <div v-if="activeTab === 'user'" class="tab-content">
          <form @submit.prevent="handleChangeUsername">
            <div class="form-field">
              <label class="form-label" for="newUsername">New Username</label>
              <input id="newUsername" v-model="newUsername" class="form-input"
                :class="{ 'input-error': !!usernameError || !!usernameServerError }" type="text"
                placeholder="Enter new username" @input="usernameServerError = ''" />
            </div>
            <div class="field-feedback">
              <div class="inline-error" :class="{ visible: !!(usernameServerError || usernameError) }">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5.5" fill="#c0392b" />
                  <path d="M6 3.5v3M6 8v.5" stroke="white" stroke-width="1.2" stroke-linecap="round" />
                </svg>
                <span>{{ usernameServerError || usernameError }}</span>
              </div>
              <span class="char-counter" :class="{ over: newUsername.length > AC.USERNAME_MAX }">
                {{ newUsername.length }} / {{ AC.USERNAME_MAX }}
              </span>
            </div>
            <div class="btn-wrap">
              <div v-if="!usernameValid" class="btn-tooltip">
                {{ usernameTooltip }}
              </div>
              <button type="submit" class="btn-save" :disabled="!usernameValid || isSubmitting">
                Save
              </button>
            </div>
          </form>
        </div>

        <div v-if="activeTab === 'pass'" class="tab-content">
          <form @submit.prevent="handleChangePassword">
            <div class="form-field">
              <label class="form-label" for="oldPassword">Current Password</label>
              <input id="oldPassword" v-model="oldPassword" class="form-input"
                :class="{ 'input-error': !!passwordServerError }" type="password" placeholder="Current password"
                @input="passwordServerError = ''" />
            </div>
            <div class="field-feedback">
              <div class="inline-error" :class="{ visible: !!passwordServerError }">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5.5" fill="#c0392b" />
                  <path d="M6 3.5v3M6 8v.5" stroke="white" stroke-width="1.2" stroke-linecap="round" />
                </svg>
                <span>{{ passwordServerError }}</span>
              </div>
            </div>

            <div class="form-field">
              <label class="form-label" for="newPassword">New Password</label>
              <input id="newPassword" v-model="newPassword" class="form-input"
                :class="{ 'input-error': !!passwordError }" type="password"
                :placeholder="`Min. ${AC.PASSWORD_MIN} characters`" />
            </div>
            <div class="strength-row">
              <div v-for="i in 4" :key="i" class="bar-seg" :class="{
                weak: i <= strengthScore && strengthClass === 'weak',
                ok: i <= strengthScore && strengthClass === 'ok',
                good: i <= strengthScore && strengthClass === 'good'
              }" />
            </div>
            <div class="field-feedback">
              <div class="inline-error" :class="{ visible: !!passwordError }">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5.5" fill="#c0392b" />
                  <path d="M6 3.5v3M6 8v.5" stroke="white" stroke-width="1.2" stroke-linecap="round" />
                </svg>
                <span>{{ passwordError }}</span>
              </div>
            </div>
            <div class="btn-wrap">
              <div v-if="!passwordValid" class="btn-tooltip">
                {{ passwordTooltip }}
              </div>
              <button type="submit" class="btn-save" :disabled="!passwordValid || isSubmitting">
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pf-outer {
  display: flex;
  width: 100%;
  justify-content: center;
}

.tab-container {
  width: 100%;
  max-width: 340px;
}

.tabs {
  display: flex;
  background: var(--theme-surface);
  border-radius: 10px 10px 0 0;
  border: 1px solid var(--theme-border-green);
  border-bottom: none;
  overflow: hidden;
}

.tab {
  flex: 1;
  padding: 10px 6px;
  text-align: center;
  font-family: var(--theme-font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--theme-text-muted);
  background: var(--theme-bg);
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: all 0.15s;
}

.tab.active {
  color: var(--theme-green);
  background: var(--theme-surface);
  border-bottom: 1px solid var(--theme-green);
}

.tab-panel {
  background: var(--theme-surface);
  border: 1px solid var(--theme-border-green);
  border-radius: 0 0 10px 10px;
  padding: 16px;
  margin-bottom: 30px;
}

.tab-content {
  animation: fadeUp 0.18s ease;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-field {
  margin-bottom: 4px;
}

.form-label {
  display: block;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--theme-text-muted);
  margin-bottom: 5px;
}

.form-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid var(--theme-border-input);
  border-radius: 8px;
  font-family: var(--theme-font-sans);
  font-size: 13.5px;
  background: var(--theme-input-bg);
  color: var(--theme-text);
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.form-input:focus {
  border-color: var(--theme-green-mid);
  background: var(--theme-surface);
  box-shadow: 0 0 0 3px rgba(61, 153, 102, 0.1);
}

.form-input.input-error {
  border-color: var(--theme-danger-dark);
  background: #fff8f8;
}

.field-feedback {
  min-height: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  padding: 0 1px;
}

.inline-error {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  flex: 1;
  min-width: 0;
  font-size: 10.5px;
  color: var(--theme-danger-dark);
  opacity: 0;
  transition: opacity 0.15s;
}

.inline-error.visible {
  opacity: 1;
}

.inline-error span {
  overflow-wrap: break-word;
  word-break: break-word;
  text-align: left;
}

.char-counter {
  font-size: 10px;
  color: var(--theme-text-muted);
  flex-shrink: 0;
}

.char-counter.over {
  color: var(--theme-danger-dark);
  font-weight: 600;
}

.strength-row {
  height: 20px;
  display: flex;
  align-items: center;
  gap: 3px;
  margin-bottom: 8px;
}

.bar-seg {
  height: 3px;
  flex: 1;
  border-radius: 2px;
  background: var(--theme-border);
  transition: background 0.2s;
}

.bar-seg.weak {
  background: var(--theme-danger-dark);
}

.bar-seg.ok {
  background: #d4a84b;
}

.bar-seg.good {
  background: var(--theme-green-mid);
}

.btn-wrap {
  position: relative;
}

.btn-tooltip {
  position: absolute;
  bottom: calc(100% + 7px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--theme-green);
  color: white;
  font-size: 10.5px;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.btn-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--theme-green);
}

@media (hover: hover) {
  .btn-wrap:hover .btn-tooltip {
    opacity: 1;
  }
}

.btn-save {
  width: 100%;
  padding: 10px;
  background: var(--theme-green);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-save:hover:not(:disabled) {
  background: var(--theme-green-dark);
}

.btn-save:disabled {
  background: #a0b89a;
  cursor: not-allowed;
}
</style>
