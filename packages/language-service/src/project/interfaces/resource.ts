import type { RawFile } from './directory/rawfile'
import type { ResFile } from './directory/resfile'
import type { ResourceGroup } from './directory/resource-group'
import type { Directory } from './file-system/file-system'
import type { Product } from './product'

export interface Resource extends Directory {
  /**
   * Get the product of the resource.
   *
   * @returns The product of the resource.
   */
  getProduct(): Product
  /**
   * Get the resource directories of the resource.
   *
   * @param force - Whether to force the get, default is false. If true, the get will be performed again.
   * @returns The resource directories of the resource.
   */
  getResourceDirectories(force?: boolean): Promise<Resource.ResourceDirectory[]>
}

export namespace Resource {
  export type ResourceDirectory = RawFile | ResFile | ResourceGroup
}
