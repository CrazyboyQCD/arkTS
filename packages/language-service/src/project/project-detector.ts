import type { LanguageServerLogger } from '@arkts/shared'
import type { URI } from 'vscode-uri'
import type { ElementJsonFile, ModuleOpenHarmonyProject, OpenHarmonyModule, OpenHarmonyProject, WorkspaceOpenHarmonyProject } from './project'
import type { FileSystemAdapter, FileSystemUpdater } from './proto/fs'
import { OpenHarmonyProjectDetectorImpl } from './impl/project-detector'

export interface OpenHarmonyProjectDetector extends FileSystemUpdater {
  /**
   * Get the logger.
   *
   * @param prefix - The prefix of the logger.
   */
  getLogger(prefix?: string): LanguageServerLogger
  /**
   * Get the file system adapter.
   */
  getFileSystem(): Promise<FileSystemAdapter>
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
   * @param resourcePath - The resource path.
   * @param ets - The ohos typescript instance.
   * @param force - If true, the name or id ranges will be read again. If not provided, the cached value will be returned.
   */
  searchResource(resourcePath: string, ets: typeof import('ohos-typescript'), force?: boolean): Promise<OpenHarmonyModule.GroupByResourceReference[]>
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
  getResourceReferenceByFilePath(filePath: URI, ets: typeof import('ohos-typescript'), force?: boolean): Promise<OpenHarmonyModule.GroupByResourceReference[]>

  setForce(force: boolean): void
  getForce(): boolean
}

export interface ProjectDetectorOptions {
  /**
   * The file system adapter for the project detector.
   */
  fs?: FileSystemAdapter
}

export function createOpenHarmonyProjectDetector(workspaceFolder: URI, options?: ProjectDetectorOptions): OpenHarmonyProjectDetector {
  return new OpenHarmonyProjectDetectorImpl(workspaceFolder, options)
}
