import type { URI } from 'vscode-uri'
import type { FileOrFolder, Resetable } from '../common'
import type { ElementJsonFile, ResourceMediaFile, ResourceRawFile } from '../file'
import type { OpenHarmonyModule } from './module'

export interface ResourceFolder extends Resetable, FileOrFolder {
  /**
   * Get the open harmony module.
   */
  getOpenHarmonyModule(): OpenHarmonyModule
  /**
   * Check if the resource child folder exists in the project.
   */
  isExist(): Promise<boolean>
  /**
   * Check if the resource child folder is the base folder.
   */
  isBase(): boolean
  /**
   * Check if the resource child folder is the dark folder.
   */
  isDark(): boolean
  /**
   * Check if the resource child folder is the rawfile folder.
   */
  isRawfile(): boolean
  /**
   * Check if the resource child folder is the resfile folder.
   */
  isResfile(): boolean
  /**
   * Check if the resource child folder is the element folder.
   */
  isElementFolder(): boolean
  /**
   * Check if the element folder exists in the resource child folder.
   *
   * ```txt
   * |-- src
   * |  |-- main
   * |  |  |-- resources
   * |  |  |  |-- base
   * |  |  |  |  |-- element <--
   * |  |  |  |  |-- ...
   * |  |  |  |-- ...
   * |  |-- ...
   * ```
   *
   * @param force - If true, the element folder will be read again. If not provided, the cached value will be returned.
   */
  readElementFolder(force?: boolean): Promise<false | ElementJsonFile[]>
  /**
   * Get the name range references of the element json files in the resource child folder.
   *
   * @param ets - The ohos typescript instance.
   * @param force - If true, the name range references will be read again. If not provided, the cached value will be returned.
   */
  getElementNameRangeReference(ets: typeof import('ohos-typescript'), force?: boolean): Promise<ElementJsonFile.NameRangeReference[]>
  /**
   * Read the media folder in the resource child folder.
   *
   * ```txt
   * |-- src
   * |  |-- main
   * |  |  |-- resources
   * |  |  |  |-- base
   * |  |  |  |  |-- media <--
   * |  |  |  |  |-- ...
   * |  |  |  |-- ...
   * |  |-- ...
   * ```
   *
   * @param force - If true, the media folder will be read again. If not provided, the cached value will be returned.
   */
  readMediaFolder(force?: boolean): Promise<false | ResourceMediaFile[]>
  /**
   * Read the file paths in the resource child folder (folder will be ignored).
   *
   * It is useful when the resource child folder is `rawfile` or `resfile`.
   *
   * @param force - If true, the file paths will be read again. If not provided, the cached value will be returned.
   */
  readRawFile(force?: boolean): Promise<ResourceRawFile[]>
  /**
   * Get the element folder path in the resource child folder.
   */
  getElementFolderPath(): URI
}
