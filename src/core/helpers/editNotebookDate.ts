import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { EditNotebookDate } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const editNotebookDate = async (
  token: string,
  notebookID: string,
  notebookUpdated: string
): Promise<EditNotebookDate> => {
  const data = await apiJsonFetch<EditNotebookDate>('api/data/edit-notebook-date', {
    method: 'POST',
    token,
    body: { notebookID, notebookUpdated },
    genericError: AC.NOTEBOOK_UPDATE_DATE_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
