import type { FileOrFolder } from '../common'
import type { ResourceFolder } from '../folder/resource'

export interface ResourceMediaFile extends FileOrFolder {
  /**
   * Get the resource child folder.
   */
  getResourceFolder(): ResourceFolder
  /**
   * Check if the element media file exists in the resource child folder.
   */
  isExist(force?: boolean): Promise<boolean>
}
