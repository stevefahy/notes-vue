import { normalizeErrorToString, toUserFriendlyError } from '../lib/error-message-map'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { AuthAuthenticate } from '../model/global'

const ENV = import.meta.env
const AC = APPLICATION_CONSTANTS

export const refreshtoken = async (): Promise<AuthAuthenticate> => {
  let response
  try {
    response = await fetch(ENV.VITE_API_ENDPOINT + `api/auth/refreshtoken`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (response.status === 404) {
      throw new Error(`404 Not Found: ${response.url}`)
    }
    if (response.status === 401) {
      try {
        const data = await response.json()
        if (data && data.error != null)
          return { error: normalizeErrorToString(data.error), fromServer: true }
      } catch {}
      return { error: `${AC.REFRESH_TOKEN_ERROR}`, fromServer: false }
    }
    if (!response.ok) {
      try {
        const errData = await response.json()
        if (errData && errData.error != null)
          return { error: normalizeErrorToString(errData.error), fromServer: true }
      } catch {}
      return {
        error:
          response.status >= 500
            ? 'The server could not be reached. Please try again.'
            : `${AC.REFRESH_TOKEN_ERROR}`,
        fromServer: false
      }
    }
  } catch (err: unknown) {
    return { error: toUserFriendlyError(err), fromServer: false }
  }
  let data: AuthAuthenticate
  try {
    data = await response.json()
    if (data === null || data === undefined) {
      return { error: `${AC.REFRESH_TOKEN_ERROR}`, fromServer: false }
    }
  } catch (err: unknown) {
    return { error: toUserFriendlyError(err), fromServer: false }
  }
  if (data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
