import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { ChangePassword, ChangePasswordObj } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const changePassword = async (
  token: string,
  passwordData: ChangePasswordObj
): Promise<ChangePassword> => {
  const data = await apiJsonFetch<ChangePassword>('api/auth/change-password', {
    method: 'PATCH',
    token,
    body: passwordData,
    genericError: AC.CHANGE_PASS_ERROR,
    unauthorizedFallback: 'Unauthorized'
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
