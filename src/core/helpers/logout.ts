import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { Logout } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const logout = async (token: string): Promise<Logout> => {
  const data = await apiJsonFetch<Logout>('api/auth/logout', {
    method: 'GET',
    token,
    genericError: AC.LOGOUT_ERROR,
    unauthorizedFallback: 'Unauthorized'
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
