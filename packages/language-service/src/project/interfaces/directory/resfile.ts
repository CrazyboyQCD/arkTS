import type { Resource } from '../resource'
import type { ResourceDirectory } from './resource-directory'

export interface ResFile extends ResourceDirectory {
  readonly resourceDirectoryKind: ResourceDirectory.Kind.ResFile
  /**
   * Get the resource of the res file.
   *
   * @returns The resource of the res file.
   */
  getResource(): Resource
}
