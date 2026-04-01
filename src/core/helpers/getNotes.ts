import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { GetNotes } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const getNotes = async (token: string, notebookId: string): Promise<GetNotes> => {
  const data = await apiJsonFetch<GetNotes>(`api/data/notes/${notebookId}`, {
    method: 'GET',
    token,
    genericError: AC.NOTES_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
