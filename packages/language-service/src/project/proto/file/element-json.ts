import type { Position } from '@volar/language-server'
import type { DeepPartial } from '../../../../../language-service/src/types/util'
import type { ResourceElementFile } from '../../../types/resource-element-file'
import type { FileOrFolder, Resetable } from '../common'
import type { ResourceFolder } from '../folder/resource'

export interface ElementJsonFile extends Resetable, FileOrFolder {
  /**
   * Get the resource element folder.
   */
  getResourceFolder(): ResourceFolder
  /**
   * Read the json text of the element json file.
   *
   * @param force - If true, the json text will be read again. If not provided, the cached value will be returned.
   */
  readJsonText(force?: boolean): Promise<string | null>
  /**
   * Read the json source file of the element json file.
   *
   * @param ets - The ohos typescript instance.
   * @param force - If true, the json source file will be read again. If not provided, the cached value will be returned.
   */
  readJsonSourceFile(ets: typeof import('ohos-typescript'), force?: boolean): Promise<import('ohos-typescript').JsonSourceFile>
  /**
   * Safe parse the json text of the element json file.
   *
   * @returns The parsed json object. If the json text is null, return null.
   */
  safeParse(): Promise<DeepPartial<ResourceElementFile> | null>
  /**
   * Get the name ranges of the element json file.
   *
   * @param ets - The ohos typescript instance.
   * @param force - If true, the name or id ranges will be read again. If not provided, the cached value will be returned.
   */
  getNameRange(ets: typeof import('ohos-typescript'), force?: boolean): Promise<ElementJsonFile.NameRange[]>
}

export namespace ElementJsonFile {
  export enum ElementKind {
    String = 'string',
    Color = 'color',
    Integer = 'integer',
    Float = 'float',
    IntArray = 'intarray',
    Boolean = 'boolean',
    Plural = 'plural',
    Pattern = 'pattern',
    StrArray = 'strarray',
    Theme = 'theme',
  }
  export namespace ElementKind {
    export function is(value: unknown): value is ElementKind {
      return Object.values(ElementKind).includes(value as ElementKind)
    }
  }

  export interface NameRange {
    kind: ElementKind
    start: Position
    end: Position
    text: string
    getElementJsonFile(): ElementJsonFile
  }

  export interface NameRangeReference {
    name: string
    references: NameRange[]
  }
}
