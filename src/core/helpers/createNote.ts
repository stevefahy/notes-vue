import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { CreateNoteObj, CreateNote } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const createNote = async (token: string, note: CreateNoteObj): Promise<CreateNote> => {
  const data = await apiJsonFetch<CreateNote>('api/data/create-note', {
    method: 'POST',
    token,
    body: note,
    genericError: AC.NOTE_CREATE_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
