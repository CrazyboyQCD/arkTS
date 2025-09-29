import type { Directory } from '../file-system/file-system'
import type { ElementJsonFile } from '../file/element-json'
import type { ResourceGroup } from './resource-group'

export interface Element extends Directory {
  /**
   * Get the resource group of the element.
   *
   * @returns The resource group of the element.
   */
  getResourceGroup(): ResourceGroup
  /**
   * Get the elements files of the resource group.
   *
   * @param force - Whether to force the get, default is false. If true, the get will be performed again.
   * @returns The elements files of the resource group.
   */
  getElementJsonFiles(force?: boolean): Promise<ElementJsonFile[]>
}
