<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { IAuthContext, onLoginT, onRegisterT } from '../core/model/global'
import APPLICATION_CONSTANTS from '../core/application-constants/application-constants'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  normalizeErrorToString,
  toUserFriendlyError
} from '@/core/lib/error-message-map'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const AC = APPLICATION_CONSTANTS

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isLogin = ref(true)
const isSubmitting = ref(false)

const username = ref<string>('')
const email = ref<string>('')
const password = ref<string>('')

const fieldErrors = ref({ username: '', email: '', password: '' })
const formError = ref('')

const usernameError = computed(() => {
  const u = username.value
  const len = u.length
  if (len === 0) return ''
  if (len < AC.USERNAME_MIN) return `At least ${AC.USERNAME_MIN} characters required`
  if (len > AC.USERNAME_MAX) return `Too long — max ${AC.USERNAME_MAX} characters`
  return ''
})

const usernameValid = computed(
  () =>
    username.value.trim().length >= AC.USERNAME_MIN &&
    username.value.length <= AC.USERNAME_MAX
)

const emailErrorSignup = computed(() => {
  if (!email.value) return ''
  if (!emailRegex.test(email.value)) return AC.EMAIL_INVALID
  return ''
})

const emailValid = computed(() => emailRegex.test(email.value))

const passwordErrorSignup = computed(() => {
  if (!password.value) return ''
  if (password.value.length < AC.PASSWORD_MIN)
    return `At least ${AC.PASSWORD_MIN} characters required`
  if (password.value.length > AC.PASSWORD_MAX) return `Max ${AC.PASSWORD_MAX} characters`
  return ''
})

const passwordValidSignup = computed(
  () =>
    password.value.length >= AC.PASSWORD_MIN &&
    password.value.length <= AC.PASSWORD_MAX
)

const strengthScore = computed(() => {
  let s = 0
  if (password.value.length >= AC.PASSWORD_MIN) s++
  if (/[A-Z]/.test(password.value)) s++
  if (/[0-9]/.test(password.value)) s++
  if (/[^A-Za-z0-9]/.test(password.value)) s++
  return s
})

const strengthClass = computed(() => {
  if (strengthScore.value <= 1) return 'weak'
  if (strengthScore.value === 2) return 'ok'
  return 'good'
})

const signupFormValid = computed(
  () => usernameValid.value && emailValid.value && passwordValidSignup.value
)

const signupSubmitTooltip = computed(() => {
  if (signupFormValid.value) return ''
  if (!username.value.trim()) return 'Enter a username'
  if (usernameError.value) return usernameError.value
  if (!email.value) return 'Enter a valid email address'
  if (!emailValid.value) return AC.EMAIL_INVALID
  if (!password.value) return 'Enter a password'
  return passwordErrorSignup.value || 'Complete the password requirements'
})

let onLogin: onLoginT
let onRegister: onRegisterT

const updateContext = (context: IAuthContext) => {
  onLogin = context.onLogin
  onRegister = context.onRegister
}
updateContext(authStore.authContext)

authStore.$subscribe((mutation, state) => {
  updateContext(state.authContext)
})

const getRedirectPath = () => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' ? redirect : AC.DEFAULT_PAGE
}

onMounted(() => {
  if (authStore.authGuardVerify()) {
    void router.replace(getRedirectPath())
  }
})

const switchAuthModeHandler = () => {
  fieldErrors.value = { username: '', email: '', password: '' }
  formError.value = ''
  isLogin.value = !isLogin.value
  username.value = ''
  email.value = ''
  password.value = ''
}

const validateLoginForm = (): boolean => {
  fieldErrors.value = { username: '', email: '', password: '' }
  formError.value = ''
  let valid = true
  if (!email.value) {
    fieldErrors.value.email = 'Email is required'
    valid = false
  } else if (!emailRegex.test(email.value)) {
    fieldErrors.value.email = AC.EMAIL_INVALID
    valid = false
  }
  if (!password.value) {
    fieldErrors.value.password = 'Password is required'
    valid = false
  }
  return valid
}

const submitHandler = async (event: Event) => {
  event.preventDefault()
  isSubmitting.value = true

  if (isLogin.value) {
    if (!validateLoginForm()) {
      isSubmitting.value = false
      return
    }
    try {
      const result = await onLogin?.(email.value, password.value)
      isSubmitting.value = false
      if (result && !('error' in result)) {
        router.push(getRedirectPath())
      } else if (result && 'error' in result) {
        const rawMsg = normalizeErrorToString(result.error)
        formError.value =
          (result as { fromServer?: boolean }).fromServer === true
            ? rawMsg
            : toUserFriendlyError(rawMsg)
      }
    } catch (err) {
      isSubmitting.value = false
      formError.value = toUserFriendlyError(err)
    }
  } else {
    if (!signupFormValid.value) {
      isSubmitting.value = false
      return
    }
    try {
      const result = await onRegister?.(username.value, email.value, password.value, 'vue')
      isSubmitting.value = false
      if (!result) return
      if ('error' in result) {
        const rawMsg = normalizeErrorToString(result.error)
        formError.value =
          (result as { fromServer?: boolean }).fromServer === true
            ? rawMsg
            : toUserFriendlyError(rawMsg)
        return
      }
      if (
        'success' in result &&
        result.success &&
        result.notebookID &&
        result.noteID
      ) {
        router.push(`/notebook/${result.notebookID}/${result.noteID}`)
      } else {
        router.push(getRedirectPath())
      }
    } catch (err) {
      isSubmitting.value = false
      formError.value = toUserFriendlyError(err)
    }
  }
}
</script>

<template>
  <div class="splash-login">
    <div class="splash-top">
      <div class="splash-logo-row">
        <div class="splash-logo-mark">
          <img alt="logo" src="/assets/images/edit_white.png" width="20" height="20" />
        </div>
        <span class="splash-logo-text">Notes</span>
      </div>
      <div class="splash-headline">
        Your notes,<br />beautifully<br />organised.
      </div>
      <div class="splash-sub">
        Write freely, stay focused. Everything in one calm, clutter-free space.
      </div>
    </div>

    <div class="login-card">
      <h2 class="login-card-title">{{ isLogin ? 'Sign in' : 'Create account' }}</h2>
      <form novalidate @submit="submitHandler">
        <template v-if="!isLogin">
          <label class="form-label" for="username">Your Name</label>
          <input id="username" v-model="username" class="form-input" :class="{ 'input-error': !!usernameError }"
            type="text" autocomplete="username" placeholder="Enter username" @input="formError = ''" />
          <div class="field-feedback">
            <div class="inline-error" :class="{ visible: !!usernameError }">
              {{ usernameError }}
            </div>
            <span class="char-counter" :class="{ over: username.length > AC.USERNAME_MAX }">
              {{ username.length }} / {{ AC.USERNAME_MAX }}
            </span>
          </div>
        </template>

        <label class="form-label" for="email">Email address</label>
        <input id="email" v-model="email" class="form-input" :class="{
          'input-error': isLogin ? !!fieldErrors.email : !!emailErrorSignup && !!email
        }" type="email" required :placeholder="isLogin ? 'Email' : 'Email'" autocomplete="email"
          @input="fieldErrors.email = ''; formError = ''" />
        <div class="field-feedback">
          <div class="inline-error" :class="{
            visible: isLogin ? !!fieldErrors.email : !!emailErrorSignup && !!email
          }">
            {{ isLogin ? fieldErrors.email : emailErrorSignup }}
          </div>
        </div>

        <label class="form-label" for="password">Password</label>
        <input id="password" v-model="password" class="form-input" :class="{
          'input-error': isLogin ? !!fieldErrors.password : !!passwordErrorSignup
        }" type="password" required :placeholder="isLogin ? 'Password' : `Min. ${AC.PASSWORD_MIN} Characters`"
          :autocomplete="isLogin ? 'current-password' : 'new-password'"
          @input="fieldErrors.password = ''; formError = ''" />
        <div v-if="!isLogin" class="strength-row">
          <div v-for="i in 4" :key="i" class="bar-seg" :class="{
            weak: i <= strengthScore && strengthClass === 'weak',
            ok: i <= strengthScore && strengthClass === 'ok',
            good: i <= strengthScore && strengthClass === 'good'
          }" />
        </div>
        <div class="field-feedback">
          <div class="inline-error" :class="{
            visible: isLogin ? !!fieldErrors.password : !!passwordErrorSignup
          }">
            {{ isLogin ? fieldErrors.password : passwordErrorSignup }}
          </div>
        </div>

        <div class="btn-wrap">
          <div v-if="!isLogin && !signupFormValid" class="btn-tooltip">
            {{ signupSubmitTooltip }}
          </div>
          <button class="btn-login" type="submit" :disabled="isSubmitting || (!isLogin && !signupFormValid)">
            {{ isLogin ? 'Sign in' : 'Create Account' }}
          </button>
        </div>

        <div class="login-alt">
          {{ isLogin ? 'No account? ' : '' }}
          <button type="button" class="login-alt-link" @click="switchAuthModeHandler">
            {{ isLogin ? 'Create one' : 'Login with existing account' }}
          </button>
        </div>

        <div class="form-error" :class="{ visible: !!formError }">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style="flex-shrink: 0" class="form-error-icon">
            <circle cx="6" cy="6" r="5.5" fill="#b91c1c" />
            <path d="M6 3.5v3M6 8v.5" stroke="white" stroke-width="1.2" stroke-linecap="round" />
          </svg>
          {{ formError }}
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.splash-login {
  background: var(--theme-lime);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding-top: 2rem;
  min-height: 100dvh;
  max-height: 100dvh;
  overflow-y: auto;
}

.splash-top {
  padding: 32px 26px 28px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.splash-logo-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 48px;
}

.splash-logo-mark {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: var(--theme-green);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.splash-logo-text {
  font-family: var(--theme-font-serif);
  font-size: 25px;
  font-weight: 600;
  color: var(--theme-green);
  letter-spacing: -0.02em;
}

.splash-headline {
  font-family: var(--theme-font-serif);
  font-size: 34px;
  font-weight: 600;
  color: var(--theme-green);
  line-height: 1.2;
  margin-bottom: 10px;
}

.splash-sub {
  font-size: 13px;
  color: rgba(31, 92, 58, 0.65);
  line-height: 1.6;
}

.login-card {
  background: var(--theme-surface);
  border-radius: var(--theme-radius-card);
  padding: 28px 24px 32px;
  margin-top: 2rem;
  flex: 0 0 auto;
  box-shadow: var(--theme-shadow-card);
  max-width: 430px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.login-card-title {
  font-family: var(--theme-font-serif);
  font-size: 19px;
  font-weight: 600;
  color: var(--theme-text);
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--theme-text-secondary);
  margin-bottom: 5px;
}

.form-input {
  width: 100%;
  background: var(--theme-input-bg);
  border: 1.5px solid var(--theme-border-input);
  border-radius: var(--theme-radius-sm);
  padding: 11px 14px;
  font-family: var(--theme-font-sans);
  font-size: 14px;
  color: var(--theme-text);
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: var(--theme-green);
  box-shadow: 0 0 0 3px rgba(46, 125, 82, 0.12);
}

.form-input:-webkit-autofill,
.form-input:-webkit-autofill:hover,
.form-input:-webkit-autofill:focus,
.form-input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px var(--theme-input-bg) inset !important;
  box-shadow: 0 0 0 30px var(--theme-input-bg) inset !important;
  -webkit-text-fill-color: var(--theme-text) !important;
  transition: background-color 5000s ease-in-out 0s;
}

.form-input.input-error {
  border-color: var(--theme-danger-dark);
  background: var(--theme-danger-light);
}

.form-input.input-error:focus {
  border-color: var(--theme-danger-dark);
}

.field-feedback {
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  margin-bottom: 10px;
  padding: 0 1px;
}

.char-counter {
  font-size: 10px;
  color: var(--theme-text-muted);
  margin-left: auto;
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
  margin-bottom: 4px;
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
  margin-top: 4px;
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

.inline-error {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 11px;
  color: var(--theme-danger-dark);
  opacity: 0;
  transition: opacity 0.15s;
}

.inline-error.visible {
  opacity: 1;
}

.btn-login {
  width: 100%;
  background: var(--theme-green);
  color: white;
  border: none;
  border-radius: var(--theme-radius-sm);
  padding: 13px;
  font-family: var(--theme-font-sans);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
  margin-bottom: 16px;
  box-shadow: var(--theme-shadow-btn);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-alt {
  text-align: center;
  font-size: 13px;
  color: var(--theme-text-secondary);
}

.login-alt-link {
  background: none;
  border: none;
  color: var(--theme-green);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  font-family: inherit;
}

.login-alt-link:hover {
  text-decoration: underline;
}

.form-error {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--theme-danger-bg);
  border: 1px solid rgba(185, 28, 28, 0.25);
  border-radius: var(--theme-radius-sm);
  padding: 10px 12px;
  font-size: 12px;
  color: var(--theme-danger-dark);
  line-height: 1.4;
  margin-top: 4px;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: opacity 0.2s, max-height 0.2s;
}

.form-error-icon {
  margin-top: -2px;
}

.form-error.visible {
  opacity: 1;
  max-height: 80px;
}

@media (max-width: 359px) {
  .splash-login {
    padding-top: 20px;
  }

  .splash-top {
    padding: 0 16px 20px;
  }

  .splash-headline {
    font-size: 26px;
    margin-bottom: 10px;
  }

  .splash-logo-row {
    margin-bottom: 10px;
  }

  .login-card {
    padding: 0 16px 20px;
  }

  .login-card-title {
    margin-bottom: 5px;
    margin-top: 25px;
    font-size: 15px;
  }

  .btn-login {
    margin-bottom: 8px;
    padding: 10px;
  }
}

@media (max-width: 431px) {
  .login-card {
    flex: 1;
    margin-top: 2rem;
    border-radius: var(--theme-radius-card) var(--theme-radius-card) 0 0;
    display: block;
  }
}

@media (max-height: 739px) {
  .login-card {
    margin-top: 0;
  }

  .splash-logo-row {
    margin-bottom: 10px;
  }

  .splash-headline {
    margin-bottom: 5px;
  }

  .splash-top {
    padding: 0 26px 15px;
  }
}
</style>
