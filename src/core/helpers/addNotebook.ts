import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { GetNotebook } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const addNotebook = async (
  token: string,
  notebook_name: string,
  notebook_cover: string
): Promise<GetNotebook> => {
  const data = await apiJsonFetch<GetNotebook>('api/data/addnotebook', {
    method: 'POST',
    token,
    body: { notebookName: notebook_name, notebookCover: notebook_cover },
    genericError: AC.NOTEBOOK_CREATE_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
