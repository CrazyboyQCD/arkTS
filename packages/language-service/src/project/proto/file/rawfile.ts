import type { FileOrFolder } from '../common'
import type { ResourceFolder } from '../folder'

export interface ResourceRawFile extends FileOrFolder {
  /**
   * Get the resource child folder.
   */
  getResourceFolder(): ResourceFolder
  /**
   * Check if the resource raw file exists in the resource child folder.
   */
  isExist(force?: boolean): Promise<boolean>
  /**
   * Get the relative path of the resource raw file.
   */
  getRelativePath(): string
  /**
   * Get the completion text of the resource raw file.
   */
  getCompletionText(currentInput: string): string
}
