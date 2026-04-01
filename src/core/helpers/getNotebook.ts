import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { GetNotebook } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const getNotebook = async (token: string, notebook_id: string): Promise<GetNotebook> => {
  const data = await apiJsonFetch<GetNotebook>(`api/data/notebook/${notebook_id}`, {
    method: 'GET',
    token,
    genericError: AC.NOTEBOOK_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
