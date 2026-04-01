import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { GetNote } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const getNote = async (
  token: string,
  notebookId: string,
  noteId: string
): Promise<GetNote> => {
  const data = await apiJsonFetch<GetNote>(`api/data/notebook/${notebookId}/${noteId}`, {
    method: 'GET',
    token,
    genericError: AC.NOTE_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
