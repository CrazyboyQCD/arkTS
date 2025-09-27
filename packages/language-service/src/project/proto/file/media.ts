import type { ImageTypeResult } from 'image-type'
import type { ETSReferenceable, FileOrFolder } from '../common'
import type { ResourceFolder } from '../folder/resource'
import { ResourceMediaFileImpl } from '../../impl/file/media'

export interface ResourceMediaFile extends FileOrFolder, ETSReferenceable {
  kind: ResourceFolder.ResourceKind.Media
  /**
   * Get the resource child folder.
   */
  getResourceFolder(): ResourceFolder
  /**
   * Check if the element media file exists in the resource child folder.
   */
  isExist(force?: boolean): Promise<boolean>
  /**
   * Get the file name of the element media file.
   */
  getFileName(): string
  /**
   * Get the file name without extension of the element media file.
   */
  getFileNameWithoutExtension(): string
  /**
   * Get the reference path of the element media file.
   */
  getReferencePath(): string
  /**
   * Check if the element media file is an image.
   *
   * @param force - If true, the image check will be performed again. If not provided, the cached value will be returned.
   */
  isImage(force?: boolean): Promise<false | ImageTypeResult>
}

export namespace ResourceMediaFile {
  export function is(value: unknown): value is ResourceMediaFile {
    return value instanceof ResourceMediaFileImpl
  }
}
