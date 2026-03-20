import { normalizeErrorToString, toUserFriendlyError } from '../lib/error-message-map'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { AuthSignup } from '../model/global'

const ENV = import.meta.env
const AC = APPLICATION_CONSTANTS

export const signup = async (
  username: string,
  email: string,
  password: string,
  framework: string
): Promise<AuthSignup> => {
  let response
  try {
    response = await fetch(ENV.VITE_API_ENDPOINT + `api/auth/signup`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password, framework })
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
      return { error: `${AC.SIGNUP_GENERAL}`, fromServer: false }
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
            : `${AC.SIGNUP_GENERAL}`,
        fromServer: false
      }
    }
  } catch (err: unknown) {
    return { error: toUserFriendlyError(err), fromServer: false }
  }
  let data: AuthSignup
  try {
    data = await response.json()
    if (data === null || data === undefined) {
      return { error: `${AC.SIGNUP_GENERAL}`, fromServer: false }
    }
  } catch (err: unknown) {
    return { error: toUserFriendlyError(err), fromServer: false }
  }
  if (data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
