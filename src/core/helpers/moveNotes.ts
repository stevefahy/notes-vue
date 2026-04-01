import { normalizeErrorToString } from '../lib/error-message-map'
import { apiJsonFetch } from '../lib/apiFetch'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { MoveNotes } from '../model/global'

const AC = APPLICATION_CONSTANTS

export const moveNotes = async (
  token: string,
  notebookId: string,
  notesSelected: string[],
  latestUpdatedDate: string | undefined
): Promise<MoveNotes> => {
  const data = await apiJsonFetch<MoveNotes>('api/data/move-notes', {
    method: 'POST',
    token,
    body: {
      notes: notesSelected,
      notebookID: notebookId,
      latestUpdatedNote: latestUpdatedDate
    },
    genericError: AC.NOTES_ERROR
  })
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { error: normalizeErrorToString(data.error), fromServer: true }
  }
  return data
}
