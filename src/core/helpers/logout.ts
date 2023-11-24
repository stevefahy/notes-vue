import { errString } from '../lib/errString'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { Logout } from '../model/global'

const ENV = import.meta.env
const AC = APPLICATION_CONSTANTS

export const logout = async (token: string): Promise<Logout> => {
  let response
  try {
    response = await fetch(ENV.VITE_API_ENDPOINT + `api/auth/logout`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
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
  let data: Logout
  try {
    data = await response.json()
    if (data === null) {
      return { error: `${AC.LOGOUT_ERROR}` }
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
