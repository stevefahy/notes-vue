import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthSignup, IAuthContext, AuthAuthenticate } from '@/core/model/global'
import { signup, login, refreshtoken, logout } from '../core/helpers'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'

const AC = APPLICATION_CONSTANTS

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const notificationStore = useNotificationStore()

  let interval: NodeJS.Timeout
  const AutoRefreshToken = () => {
    interval = setInterval(() => {
      if (!authContext.value.success) {
        autoLogout()
      } else {
        verifyRefreshToken()
      }
    }, AC.REFRESH_TOKEN_INTERVAL)
  }

  AutoRefreshToken()

  const showNotification = (msg: string) => {
    notificationStore.ShowNotification({
      notification: { n_status: 'error', title: 'Error!', message: msg }
    })
  }

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
          showNotification(`${response.error}`)
          return
        }
        if (response.success) {
          resetAuthContext()
          const dateNow: number = Date.now()
          window.localStorage.setItem('logout', '' + dateNow)
          router.push(`${AC.LOGIN_PAGE}`)
        }
      } catch (err) {
        showNotification(`${err}`)
        return
      }
    }
  }

  const autoLogout = () => {
    router.push(`${AC.LOGIN_PAGE}`)
    clearInterval(interval)
  }

  const isTokenExpired = (token: string) => {
    if (!token || token.length <= 0) {
      return true
    }
    const decode = JSON.parse(atob(token.split('.')[1]))
    if (decode.exp * 1000 < new Date().getTime()) {
      return true
    }
    return false
  }

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
    } catch (err) {
      resetAuthContext()
      autoLogout()
    }
  }

  const getRefreshToken = async () => {
    try {
      const response = await refreshtoken()
      if (!response) {
        return
      }
      if (response.error) {
        // showNotification(`${response.error}`)
        return
      }
      if (response.success) {
        return response
      }
    } catch (err) {
      // showNotification(`${err}`)
      return
    }
    return
  }

  const handleLogout = async () => {
    const context = await getRefreshToken()
    if (context && context.token !== null) {
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
          showNotification(`${response.error}`)
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
        showNotification(`${err}`)
        return
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
          showNotification(`${response.error}`)
          return { error: `${response.error}` }
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
        showNotification(`${err}`)
        return { error: `${err}` }
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
    if (!authContext.value.token) {
      await verifyRefreshToken()
    }
    return authContext
  }

  const authGuardVerify = async () => {
    return !isTokenExpired(authContext.value.token!)
  }

  return { authContext, authGuardVerify, getAuth }
})
