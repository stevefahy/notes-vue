import { errString } from '../lib/errString'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { EditNotebookDate } from '../model/global'

const ENV = import.meta.env
const AC = APPLICATION_CONSTANTS

export const editNotebookDate = async (
  token: string,
  notebookID: string,
  notebookUpdated: string
): Promise<EditNotebookDate> => {
  let response
  const edit = {
    notebookID,
    notebookUpdated
  }
  try {
    response = await fetch(ENV.VITE_API_ENDPOINT + `api/data/edit-notebook-date`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(edit)
    })
    if (response.status === 404) {
      throw new Error(`${response.url} Not Found.`)
    }
  } catch (err: unknown) {
    const errMessage = errString(err)
    return { error: errMessage }
  }
  let data: EditNotebookDate
  try {
    data = await response.json()
    if (data === null) {
      return { error: `${AC.NOTEBOOK_UPDATE_DATE_ERROR}` }
    }
  } catch (err: unknown) {
    const errMessage = errString(err)
    return { error: errMessage }
  }
  if (data.error) {
    return { error: data.error }
  }
  return data
}
