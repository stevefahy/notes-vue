import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { ChangeUsername } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const changeUsername = async (
  token: string,
  usernameData: object
): Promise<ChangeUsername> => {
  const data = await apiJsonFetch<ChangeUsername>('api/auth/change-username', {
    method: 'POST',
    token,
    body: usernameData,
    genericError: AC.CHANGE_USER_ERROR,
    unauthorizedFallback: 'Unauthorized'
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
