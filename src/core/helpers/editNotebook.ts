import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { EditNotebook } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const editNotebook = async (
  token: string,
  notebookID: string,
  notebookName: string,
  notebookCover: string,
  notebookUpdated: string
): Promise<EditNotebook> => {
  const data = await apiJsonFetch<EditNotebook>('api/data/edit-notebook', {
    method: 'POST',
    token,
    body: { notebookID, notebookName, notebookCover, notebookUpdated },
    genericError: AC.GENERAL_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
