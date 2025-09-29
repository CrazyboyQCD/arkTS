import type { ResourceElementFile } from '@arkts/types'
import type { DeepPartial } from '../../../types/util'
import type { ElementJsonNameReference } from '../reference/element-json-name'
import type { JsonLikeFile } from './json-like-file'

export interface ElementJsonFile extends JsonLikeFile<DeepPartial<ResourceElementFile>> {
  /**
   * Get the element directory.
   *
   * @returns The element directory.
   */
  getElement(): Element
  /**
   * Get the name references of the element json file.
   *
   * @param ets - The ETS instance.
   * @param force - Whether to force the get, default is false. If true, the get will be performed again.
   * @returns The name references of the element json file.
   */
  getNameReferences(ets: typeof import('ohos-typescript'), force?: boolean): Promise<ElementJsonNameReference[]>
}
