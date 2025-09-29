import type { ResourceElementFile } from 'packages/types/out'
import type { FullableReference, PathableReference } from '../common'
import type { ElementJsonFile } from '../file/element-json'

export interface ElementJsonNameReference extends FullableReference, PathableReference {
  /**
   * Get the element json file of the name reference.
   *
   * @returns The element json file of the name reference.
   */
  getFile(): ElementJsonFile
  /**
   * Get the kind of the name reference.
   *
   * @returns The kind of the name reference.
   */
  getKind(): ResourceElementFile.Kind
}
