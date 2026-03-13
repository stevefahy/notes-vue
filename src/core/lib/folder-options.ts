export type NotebookCoverType = 'forest' | 'emerald' | 'lime' | 'sage'

export interface FolderOption {
  value: NotebookCoverType
  viewValue: string
}

export const FolderOptions: FolderOption[] = [
  { value: 'forest', viewValue: 'Forest' },
  { value: 'emerald', viewValue: 'Emerald' },
  { value: 'lime', viewValue: 'Lime' },
  { value: 'sage', viewValue: 'Sage' }
]

/** Map legacy API cover values to new theme cover types for display */
export function mapLegacyCover(legacy: string): NotebookCoverType {
  const map: Record<string, NotebookCoverType> = {
    default: 'sage',
    red: 'forest',
    green: 'lime',
    blue: 'emerald'
  }
  return (map[legacy] ?? legacy) as NotebookCoverType
}

/** Map new cover types to legacy API values when sending to server */
export function toLegacyCover(cover: NotebookCoverType): string {
  const map: Record<string, string> = {
    forest: 'red',
    emerald: 'blue',
    lime: 'green',
    sage: 'default'
  }
  return map[cover] ?? cover
}
