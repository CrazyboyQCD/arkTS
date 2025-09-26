import type { LanguageServerLogger } from '@arkts/shared'
import type { URI } from 'vscode-uri'
import type { ElementJsonFile, ModuleOpenHarmonyProject, OpenHarmonyProject, WorkspaceOpenHarmonyProject } from './project'
import { OpenHarmonyProjectDetectorImpl } from './impl/project-detector'

export interface OpenHarmonyProjectDetector {
  /**
   * Get the logger.
   *
   * @param prefix - The prefix of the logger.
   */
  getLogger(prefix?: string): LanguageServerLogger
  /**
   * Get the workspace folder.
   */
  getWorkspaceFolder(): URI
  /**
   * Find all projects in the workspace.
   *
   * @param force - If true, the projects will be read again. If not provided, the cached value will be returned.
   */
  findProjects(force?: boolean): Promise<OpenHarmonyProject[]>
  /**
   * Search the project by the file path.
   *
   * @param filePath - The file path.
   * @param instanceType - The instance type.
   * @param force - If true, the project will be read again. If not provided, the cached value will be returned.
   */
  searchProject<InstanceType extends 'module' | 'workspace'>(filePath: URI, instanceType?: InstanceType, force?: boolean): Promise<
    (InstanceType extends 'module'
      ? ModuleOpenHarmonyProject
      : InstanceType extends 'workspace'
        ? WorkspaceOpenHarmonyProject
        : OpenHarmonyProject) | null
  >
  /**
   * Search the element json file by the file path.
   *
   * @param filePath - The file path.
   * @param force - If true, the element json file will be read again. If not provided, the cached value will be returned.
   */
  searchResourceElementFile(filePath: URI, force?: boolean): Promise<ElementJsonFile | null>
  /**
   * Search the related element json files by the element kind and name.
   *
   * @param elementKind - The element kind.
   * @param name - The name of the element.
   * @param ets - The ohos typescript instance.
   * @param force - If true, the name or id ranges will be read again. If not provided, the cached value will be returned.
   */
  searchResourceElementRange(elementKind: ElementJsonFile.ElementKind, name: string, ets: typeof import('ohos-typescript'), force?: boolean): Promise<ElementJsonFile.NameRange[] | null>
  /**
   * Search the project by the module.json5 file path.
   *
   * @param filePath - The file path.
   * @param ets - The ohos typescript instance.
   * @param force - If true, the project will be read again. If not provided, the cached value will be returned.
   */
  searchProjectByModuleJson5<T = ModuleOpenHarmonyProject>(filePath: URI, ets: typeof import('ohos-typescript'), force?: boolean): Promise<T | null>
  /**
   * Get the resource reference by the file path.
   *
   * @description
   * It will be searched the project by the file path and return the related resource reference.
   *
   * ⚠️ NOTE: It just only return the same {@linkcode OpenHarmonyModule} resource reference.
   *
   * @param filePath - The file path.
   * @param ets - The ohos typescript instance.
   * @param force - If true, the resource reference will be read again. If not provided, the cached value will be returned.
   */
  getResourceReferenceByFilePath(filePath: URI, ets: typeof import('ohos-typescript'), force?: boolean): Promise<ElementJsonFile.NameRangeReference[]>

  setForce(force: boolean): void
  getForce(): boolean
  update(uri: URI): Promise<void>
}

export function createOpenHarmonyProjectDetector(workspaceFolder: URI): OpenHarmonyProjectDetector {
  return new OpenHarmonyProjectDetectorImpl(workspaceFolder)
}
