import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { SaveNote } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const saveNote = async (
  token: string,
  notebookId: string,
  noteId: string,
  note: string
): Promise<SaveNote> => {
  const data = await apiJsonFetch<SaveNote>('api/data/save-note', {
    method: 'POST',
    token,
    body: { notebookID: notebookId, noteID: noteId, note },
    genericError: AC.NOTE_SAVE_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
