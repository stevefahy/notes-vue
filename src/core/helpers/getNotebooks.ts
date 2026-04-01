import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { GetNotebooks } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const getNotebooks = async (token: string): Promise<GetNotebooks> => {
  const data = await apiJsonFetch<GetNotebooks>('api/data/notebooks', {
    method: 'GET',
    token,
    genericError: AC.NOTEBOOKS_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
