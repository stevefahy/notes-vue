import { errString } from '../lib/errString'
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
      throw new Error(`${response.url} Not Found.`)
    }
    if (response.status === 401) {
      throw new Error(`Unauthorized`)
    }
  } catch (err: unknown) {
    const errMessage = errString(err)
    return { error: errMessage }
  }
  let data: AuthSignup
  try {
    data = await response.json()
    if (data === null || data === undefined) {
      return { error: `${AC.SIGNUP_ERROR}` }
    }
  } catch (err: unknown) {
    const errMessage = errString(err)
    return { error: errMessage }
  }
  if (data.error) {
    return { error: data.error }
  }
  return data
}
