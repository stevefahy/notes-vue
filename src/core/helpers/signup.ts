import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { AuthSignup } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const signup = async (
  username: string,
  email: string,
  password: string,
  framework: string
): Promise<AuthSignup> => {
  const data = await apiJsonFetch<AuthSignup>('api/auth/signup', {
    method: 'POST',
    body: { username, email, password, framework },
    genericError: AC.SIGNUP_GENERAL,
    unauthorizedFallback: AC.SIGNUP_GENERAL
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
