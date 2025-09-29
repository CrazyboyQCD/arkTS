import type { Resource } from '../resource'
import type { ResourceDirectory } from './resource-directory'

export interface RawFile extends ResourceDirectory {
  readonly resourceDirectoryKind: ResourceDirectory.Kind.RawFile
  /**
   * Get the resource of the raw file.
   *
   * @returns The resource of the raw file.
   */
  getResource(): Resource
}
