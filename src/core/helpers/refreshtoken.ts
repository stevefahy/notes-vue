import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { AuthAuthenticate } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const refreshtoken = async (): Promise<AuthAuthenticate> => {
  const data = await apiJsonFetch<AuthAuthenticate>('api/auth/refreshtoken', {
    method: 'GET',
    cache: 'no-store',
    genericError: AC.REFRESH_TOKEN_ERROR,
    unauthorizedFallback: AC.REFRESH_TOKEN_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
