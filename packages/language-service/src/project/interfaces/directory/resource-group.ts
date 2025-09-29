import type { Resource } from '../resource'
import type { Element } from './element'
import type { ResourceDirectory } from './resource-directory'

export interface ResourceGroup extends ResourceDirectory {
  readonly resourceDirectoryKind: ResourceDirectory.Kind.ResourceGroup
  /**
   * Get the resource of the qualifier.
   *
   * @returns The resource of the qualifier.
   */
  getResource(): Resource
  /**
   * Get the element of the resource group.
   *
   * @param force - Whether to force the get, default is false. If true, the get will be performed again.
   * @returns The element of the resource group.
   */
  getElement(force?: boolean): Promise<Element>
}
