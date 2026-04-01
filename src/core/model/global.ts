// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Global {}

import type { TDateISO } from './date'

/** Server write acknowledgments (MongoDB-shaped JSON); client treats as opaque. */
export type ApiWriteAck = Record<string, unknown>

// Note Editor

export interface NoteEditor {
  visible: boolean
  splitScreen: boolean
  loadedText: string
  updateViewText: (updatedView: string) => void
  passUpdatedViewText: string
}

export interface NoteEditorView {
  visible: boolean
  splitScreen: boolean
  viewText: string
  updatedViewText: (updatedEdit: string) => void
}

export interface ViewNoteThumb {
  text: string
}

export interface ViewNoteMarkdownProps {
  viewText: string
  updatedViewText?: (updatedEdit: string) => void
  disableLinks: boolean
}

export interface SourcePosition {
  start: { column?: number; line?: number; offset?: number }
  end: { column?: number; line?: number; offset?: number }
}

// Note

export interface Note {
  _id: string
  note: string
  notebook: string
  createdAt: TDateISO | 'No date'
  updatedAt: TDateISO | 'No date'
}

// Notebook

export interface NotebookItem {
  notebook_item: Notebook
}

export interface Notebook {
  _id: string
  notebook_name: string
  notebook_cover: NotebookCoverType
  createdAt?: TDateISO | 'No date'
  updatedAt?: TDateISO | 'No date'
  noteCount?: number
}

interface CreateNoteError {
  error: string
  fromServer?: boolean
  success?: never
  note?: never
}

interface CreateNoteSuccess {
  error?: never
  success: boolean
  note: ApiWriteAck
}

export type CreateNote = CreateNoteError | CreateNoteSuccess

interface DeleteNotebookError {
  error: string
  fromServer?: boolean
  success?: never
  notebook_deleted?: never
  server_response?: never
}

interface DeleteNotebookSuccess {
  error?: never
  success: boolean
  notebook_deleted: string
  server_response: ApiWriteAck
}

export type DeleteNotebook = DeleteNotebookError | DeleteNotebookSuccess

interface EditNotebookDateError {
  error: string
  fromServer?: boolean
  success?: never
  notebook_date_updated?: never
}

interface EditNotebookDateSuccess {
  error?: never
  success: boolean
  notebook_deleted: string
  server_response: ApiWriteAck
}

export type EditNotebookDate = EditNotebookDateError | EditNotebookDateSuccess

interface EditNotebookError {
  error: string
  fromServer?: boolean
  success?: never
  notebook_edited?: never
}

interface EditNotebookSuccess {
  error?: never
  success: boolean
  notebook_edited: Notebook
}

export type EditNotebook = EditNotebookError | EditNotebookSuccess

interface GetNotebookError {
  error: string
  fromServer?: boolean
  success?: never
  notebook?: never
}

interface GetNotebookSuccess {
  error?: never
  success: boolean
  notebook: Notebook
}

export type GetNotebook = GetNotebookError | GetNotebookSuccess

export interface GetNotebooksError {
  error: string
  fromServer?: boolean
  success?: never
  notebooks?: never
}

export interface GetNotebooksSuccess {
  error?: never
  success: boolean
  notebooks: Notebook[]
}

export type GetNotebooks = GetNotebooksError | GetNotebooksSuccess

export interface NotebooksListProps {
  notebooks: GetNotebooks
}

export interface CheckedNote {
  id: string
  selected: boolean
}

export interface SelectedNote {
  selected: string[]
}

export interface NotesProps {
  notes: Note[]
  onNotesSelected: (selected: SelectedNote) => void
  onNotesEdit: boolean
  onClearNotesEdit: boolean
}

export type NotebookAddEditMethod = 'edit' | 'create'

export interface NotebookAddEdit {
  method: NotebookAddEditMethod
  notebook?: Notebook
  open?: boolean
  onCancel: () => void
  addNotebook?: (
    notebook_name: string,
    notebook_cover: NotebookCoverType
  ) => boolean | Promise<boolean>
  editNotebook?: (
    notebook_id: string,
    notebook_name: string,
    notebook_cover: NotebookCoverType,
    notebook_updated: string
  ) => boolean | Promise<boolean>
}

// SelectNotebookForm

export interface SelectNotebookFormProps {
  notebooks: Notebook[]
  currentNotebookId: string | null
  open?: boolean
  onCancel: () => void
  moveNotes: (notebook_id: string) => void
}

// Notification

export type NotificationStatus = 'pending' | 'success' | 'error' | null

export interface NotificationInterface {
  n_status: NotificationStatus | null
  title: string | null
  message: string | null
}

export type NotificationObject = {
  notification: NotificationInterface
}

// Alert

export type ErrorSeverity = '' | 'error' | 'warning' | 'info' | 'success'

export interface AlertInterface {
  error_state?: boolean
  error_severity?: ErrorSeverity
  message?: string
}

// Profile Form

export interface NewUsernameObj {
  newUsername: string
}

export interface ChangePasswordObj {
  oldPassword: string | undefined
  newPassword: string | undefined
}

export interface ProfileFormProps {
  onChangePassword: (
    arg0: ChangePasswordObj
  ) => Promise<void | { error: string; fromServer?: boolean }>
  onChangeUsername: (
    arg0: NewUsernameObj
  ) => Promise<void | { error: string; fromServer?: boolean }>
  userName: string | undefined
}

// Breadcrumb

export type PageType = 'notebooks' | 'notebook' | 'note' | 'profile' | 'other'

export type NotebookCoverType =
  | 'default'
  | 'red'
  | 'green'
  | 'blue'
  | 'forest'
  | 'emerald'
  | 'lime'
  | 'sage'

export type NotebookType = {
  name: string
  id: string
  cover: NotebookCoverType
}

export interface Edited {
  _id: string
  notebook_name: string
  notebook_cover: NotebookCoverType
}

// Snackbar

export type SnackVariant = 'success' | 'error' | 'warning'

export interface Snack {
  n_status: boolean | null
  message: string | null
  variant?: SnackVariant
}

export interface SnackbarProps {
  status: boolean | null
  message: string | null
}

export interface CreateNoteObj {
  notebookId: string
  note: string
}

// API RESPONSES

interface DeleteNotesError {
  success?: never
  notes_deleted?: never
  error: string
  fromServer?: boolean
}

interface DeleteNotesSuccess {
  success: boolean
  notes_deleted: ApiWriteAck
  error?: never
}

export type DeleteNotes = DeleteNotesError | DeleteNotesSuccess

interface GetNoteError {
  success?: never
  note?: never
  error: string
  fromServer?: boolean
}

interface GetNoteSuccess {
  success: boolean
  note: Note
  error?: never
}

export type GetNote = GetNoteError | GetNoteSuccess

interface GetNotesError {
  success?: never
  notes?: never
  error: string
  fromServer?: boolean
}

interface GetNotesSuccess {
  success: boolean
  notes: Note[]
  error?: never
}

export type GetNotes = GetNotesError | GetNotesSuccess

interface MoveNotesError {
  success?: never
  notes_moved?: never
  server_response?: never
  error: string
  fromServer?: boolean
}

interface MoveNotesSuccess {
  success: boolean
  notes_moved: string[]
  server_response: ApiWriteAck
  error?: never
}

export type MoveNotes = MoveNotesError | MoveNotesSuccess

interface SaveNoteError {
  success?: never
  server_response?: never
  error: string
  fromServer?: boolean
}

interface SaveNoteSuccess {
  success: boolean
  server_response: ApiWriteAck
  error?: never
}

export type SaveNote = SaveNoteError | SaveNoteSuccess

interface ChangePasswordError {
  success?: never
  error: string
  fromServer?: boolean
}

interface ChangePasswordSuccess {
  success: boolean
  error?: never
}

export type ChangePassword = ChangePasswordError | ChangePasswordSuccess

interface ChangeUsernameError {
  success?: never
  details?: never
  error: string
  fromServer?: boolean
}

interface ChangeUsernameSuccess {
  success: boolean
  details: IAuthDetails
  error?: never
}

export type ChangeUsername = ChangeUsernameError | ChangeUsernameSuccess

interface LogoutError {
  success?: never
  error: string
  fromServer?: boolean
}

interface LogoutSuccess {
  success: boolean
  error?: never
}

export type Logout = LogoutError | LogoutSuccess

// AuthContext

export interface AuthContextType {
  authContext: IAuthContext
}

export interface IAuthDetails {
  authStrategy: string
  username: string
  email: string
  __v: number
  _id: string
}

export type onLoginT = (email: string, password: string) => Promise<AuthAuthenticate> | void
export type onRegisterT = (
  username: string,
  email: string,
  password: string,
  framework: string
) => Promise<AuthSignup> | void

export interface IAuthContext {
  loading: boolean | null
  success: boolean | null
  token: string | null
  details: IAuthDetails | null
  onLogin: onLoginT
  onRegister: onRegisterT
  onLogout: () => void
  notebookID: string | null
  noteID: string | null
}

interface AuthAuthenticateError {
  success?: never
  token?: never
  details?: never
  error: string
  fromServer?: boolean
}

interface AuthAuthenticateSuccess {
  success: boolean
  token: string
  details: IAuthDetails
  error?: never
}

// AuthAuthenticate used by refreshtoken and login
export type AuthAuthenticate = AuthAuthenticateError | AuthAuthenticateSuccess | undefined

interface WelcomeNoteSuccess {
  notebookID: string
  noteID: string
}

interface WelcomeNoteError {
  notebookID?: never
  noteID?: never
}

export type AuthSignup =
  | (AuthAuthenticateError & WelcomeNoteError)
  | (AuthAuthenticateSuccess & WelcomeNoteSuccess)
  | undefined

export interface FolderOptionsInterface {
  value: string
  viewValue: string
}

export type WindowDimensions = {
  width: number
  height: number
  viewnote_width: number | null | undefined
  addListener: () => void
  removeListener: () => void
}

export type ButtonSize = 'small' | 'default'
