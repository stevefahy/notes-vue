import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { DeleteNotebook } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const deleteNotebook = async (
  token: string,
  notebook_id: string
): Promise<DeleteNotebook> => {
  const data = await apiJsonFetch<DeleteNotebook>('api/data/delete-notebook', {
    method: 'POST',
    token,
    body: { notebookID: notebook_id },
    genericError: AC.NOTEBOOK_DELETE_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
