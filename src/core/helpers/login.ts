import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { AuthAuthenticate } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const login = async (email: string, password: string): Promise<AuthAuthenticate> => {
  const data = await apiJsonFetch<AuthAuthenticate>('api/auth/login', {
    method: 'POST',
    body: { email, password },
    genericError: AC.LOGIN_ERROR,
    unauthorizedFallback: AC.LOGIN_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
