import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { DeleteNotes } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const deleteNotes = async (
  token: string,
  notes_selected: string[]
): Promise<DeleteNotes> => {
  const data = await apiJsonFetch<DeleteNotes>('api/data/delete-notes', {
    method: 'POST',
    token,
    body: { note_ids: notes_selected },
    genericError: AC.NOTES_DELETE_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
