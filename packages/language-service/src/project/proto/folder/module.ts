import type { URI } from 'vscode-uri'
import type { Resetable } from '../common'
import type { ElementJsonFile, ResourceMediaFile } from '../file'
import type { ModuleOpenHarmonyProject } from '../project'
import type { ResourceFolder } from './resource'

export interface OpenHarmonyModule extends Resetable {
  /**
   * Get the module open harmony project.
   */
  getModuleOpenHarmonyProject(): ModuleOpenHarmonyProject
  /**
   * Get the module path.
   */
  getModulePath(): URI
  /**
   * Get the module.json5 path.
   */
  getModuleJson5Path(): URI
  /**
   * Get the resource folder path.
   */
  getResourceFolderPath(): URI
  /**
   * Read the module.json5 file. If the file does not exist, return null.
   *
   * ```txt
   * |-- src
   * |  |-- main
   * |  |  |-- module.json5 <--
   * |  |-- mock
   * |  |-- test
   * |  |-- ...
   * ```
   */
  readModuleJson5Text(): Promise<string | null>
  /**
   * Read the module.json5 source file. If the file does not exist, throw an error.
   *
   * @param ets - The ohos typescript instance.
   * @param force - If true, the module.json5 source file will be read again. If not provided, the cached value will be returned.
   */
  readModuleJson5SourceFile(ets: typeof import('ohos-typescript'), force?: boolean): Promise<import('ohos-typescript').JsonSourceFile | null>
  /**
   * Check if the resource child folder exists in the project.
   *
   * ```txt
   * |-- src
   * |  |-- main
   * |  |  |-- resources
   * |  |  |  |-- base ---|
   * |  |  |  |-- dark    |
   * |  |  |  |-- rawfile |
   * |  |  |  |-- resfile |
   * |  |  |  |-- en_US   |
   * |  |  |  |-- ...  ---|
   * |  |-- ...
   */
  readResourceFolder(force?: boolean): Promise<ResourceFolder[] | false>
  /**
   * Group the resource reference by the resource kind、element kind and element name.
   *
   * @param ets - The ohos typescript instance.
   * @param force - If true, the resource reference will be read again. If not provided, the cached value will be returned.
   */
  groupByResourceReference(ets: typeof import('ohos-typescript'), force?: boolean): Promise<OpenHarmonyModule.GroupByResourceReference[]>
}

export namespace OpenHarmonyModule {
  export type GroupByResourceReference = ElementJsonFile.NameRangeReference | ResourceMediaFile
}
