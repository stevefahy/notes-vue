import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthSignup, IAuthContext, AuthAuthenticate } from '@/core/model/global'
import { signup, login, refreshtoken, logout } from '../core/helpers'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'
import router from '@/router'
import { useSnackStore } from '@/stores/snack'
import { normalizeErrorToString, toUserFriendlyError } from '@/core/lib/error-message-map'
import { isJwtExpired } from '@/core/lib/jwt'

const AC = APPLICATION_CONSTANTS

export const useAuthStore = defineStore('auth', () => {
  const snackStore = useSnackStore()

  let interval: ReturnType<typeof setInterval>
  const AutoRefreshToken = () => {
    interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      if (!authContext.value.success) {
        autoLogout()
      } else {
        verifyRefreshToken()
      }
    }, AC.REFRESH_TOKEN_INTERVAL)
  }

  AutoRefreshToken()

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(() => verifyRefreshTokenWithRetry(), 500)
    }
  })

  const resetAuthContext = () => {
    authContext.value = {
      ...authContext.value,
      success: null,
      token: null,
      details: null,
      loading: false
    }
  }

  const logoutHandler = async (token: string) => {
    if (token) {
      try {
        const response = await logout(token)
        if (response.error) {
          snackStore.showErrorSnack(normalizeErrorToString(response.error), {
            fromServer: (response as { fromServer?: boolean }).fromServer
          })
          return
        }
        if (response.success) {
          resetAuthContext()
          const dateNow: number = Date.now()
          window.localStorage.setItem('logout', '' + dateNow)
          router.push(`${AC.LOGIN_PAGE}`)
        }
      } catch (err) {
        snackStore.showErrorSnack(normalizeErrorToString(err), { fromServer: false })
        return
      }
    }
  }

  const autoLogout = () => {
    router.push(`${AC.LOGIN_PAGE}`)
    clearInterval(interval)
  }

  const isTokenExpired = (token: string | null | undefined) => isJwtExpired(token)

  const verifyRefreshToken = async () => {
    try {
      const response = await getRefreshToken()
      if (response === null || response === undefined) {
        resetAuthContext()
        autoLogout()
        return
      }
      if (response.success) {
        authContext.value = {
          ...authContext.value,
          success: response.success,
          details: response.details,
          token: response.token,
          loading: false
        }
      } else {
        autoLogout()
      }
    } catch {
      resetAuthContext()
      autoLogout()
    }
  }

  const verifyRefreshTokenWithRetry = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await getRefreshToken()
        if (response?.success) {
          authContext.value = {
            ...authContext.value,
            success: response.success,
            details: response.details,
            token: response.token,
            loading: false
          }
          return
        }
      } catch {
        /* retry on next iteration */
      }
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
    resetAuthContext()
    autoLogout()
  }

  let refreshInProgress: Promise<Awaited<ReturnType<typeof refreshtoken>> | undefined> | null = null

  const getRefreshToken = async () => {
    if (refreshInProgress) {
      return refreshInProgress
    }
    const promise = (async () => {
      try {
        const response = await refreshtoken()
        if (!response) {
          return
        }
        if (response.error) {
          return
        }
        if (response.success) {
          return response
        }
      } catch {
        return
      }
      return
    })()
    refreshInProgress = promise
    try {
      return await promise
    } finally {
      refreshInProgress = null
    }
  }

  const handleLogout = async () => {
    const context = await getRefreshToken()
    if (context?.token) {
      logoutHandler(context.token)
    }
  }

  const handleLogin = async (email: string, password: string): Promise<AuthAuthenticate> => {
    if (email && password) {
      try {
        const response: AuthAuthenticate = await login(email, password)
        if (!response) {
          return
        }
        if (response.error) {
          return response
        }
        if (response.success) {
          authContext.value = {
            ...authContext.value,
            success: response.success,
            details: response.details,
            token: response.token,
            loading: false
          }
          return response
        }
        return response
      } catch (err) {
        return { error: toUserFriendlyError(err), fromServer: false }
      }
    } else {
      return
    }
  }

  const handleSignup = async (
    username: string,
    email: string,
    password: string,
    framework: string
  ): Promise<AuthSignup> => {
    if (email && password) {
      try {
        const response: AuthSignup = await signup(username, email, password, framework)
        if (!response) {
          return { error: `${AC.GENERAL_ERROR}` }
        }
        if (response.error) {
          return {
            error: normalizeErrorToString(response.error),
            fromServer: (response as { fromServer?: boolean }).fromServer
          }
        }
        if (response.success) {
          authContext.value = {
            ...authContext.value,
            success: response.success,
            details: response.details,
            token: response.token,
            loading: false
          }
          return {
            success: response.success,
            token: response.token,
            details: response.details,
            notebookID: response.notebookID,
            noteID: response.noteID
          }
        }
      } catch (err) {
        return { error: toUserFriendlyError(err), fromServer: false }
      }
    } else {
      return { error: `${AC.GENERAL_ERROR}` }
    }
  }

  const authContext: Ref<IAuthContext> = ref({
    loading: true,
    details: null,
    success: null,
    token: null,
    onLogin: handleLogin,
    onLogout: handleLogout,
    onRegister: handleSignup,
    notebookID: null,
    noteID: null
  })

  const getAuth = async () => {
    const t = authContext.value.token
    if (!t || isTokenExpired(t)) {
      await verifyRefreshTokenWithRetry()
    }
    return authContext
  }

  /** Synchronous: true when a non-expired access token is present (after getAuth refresh). */
  const authGuardVerify = () => {
    const t = authContext.value.token
    return !!t && !isTokenExpired(t)
  }

  return { authContext, authGuardVerify, getAuth }
})
