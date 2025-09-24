import type { URI } from 'vscode-uri'
import type { BuildProfile } from '../types/build-profile'
import type { ModuleJson5 } from '../types/module-json5'
import type { OhPackageJson5 } from '../types/oh-package5'
import type { DeepPartial } from '../types/util'
import type { OpenHarmonyProjectDetector } from './project-detector'
import { ModuleOpenHarmonyProjectImpl } from './impl/module-level-project'
import { OpenHarmonyProjectImpl } from './impl/openharmony-project'
import { WorkspaceOpenHarmonyProjectImpl } from './impl/workspace-level-project'

export interface OpenHarmonyProject {
  /**
   * Get the project root URI.
   */
  getProjectRoot(): URI
  /**
   * Read the oh-package.json5 file in the project root. If the file does not exist, return null.
   */
  readOhPackageJson5(): Promise<DeepPartial<OhPackageJson5> | null>
  /**
   * Read the build-profile.json5 file in the project root. If the file does not exist, return null.
   */
  readBuildProfileJson5(): Promise<DeepPartial<BuildProfile> | null>
  /**
   * Reset the project state & clear the cache.
   *
   * @param resetTypes - The types of the project state to reset. If not provided, all types will be reset.
   */
  reset(resetTypes?: readonly OpenHarmonyProject.ResetType[]): Promise<void>
  /** - Check if the project is a valid open harmony project. */
  is(): Promise<boolean>
}

export namespace OpenHarmonyProject {
  export type ResetType = 'oh-package.json5' | 'build-profile.json5' | (string & {})

  export function is(value: unknown): value is OpenHarmonyProject {
    return value instanceof OpenHarmonyProjectImpl
  }

  export async function isProject(projectRoot: URI, projectDetector: OpenHarmonyProjectDetector): Promise<false | OpenHarmonyProject> {
    // 先检测是否是模块级项目，后检测是否是工作空间级项目。
    // 因为一般来讲，模块极项目的数量会比工作空间级项目的数量多，这样能减少不必要的检测。
    const moduleProject = new ModuleOpenHarmonyProjectImpl(projectRoot, projectDetector)
    if (await moduleProject.is())
      return moduleProject
    const workspaceProject = new WorkspaceOpenHarmonyProjectImpl(projectRoot, projectDetector)
    if (await workspaceProject.is())
      return workspaceProject
    return false
  }
}

export interface ElementJsonFile {
  /**
   * Get the element json file URI.
   */
  getUri(): URI
  /**
   * Get the resource element folder.
   */
  getResourceChildFolder(): ResourceChildFolder
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
}

export interface ResourceChildFolder {
  /**
   * Get the module open harmony project.
   */
  getModuleOpenHarmonyProject(): ModuleOpenHarmonyProject
  /**
   * Get the folder name.
   */
  getFolderName(): 'base' | 'dark' | 'rawfile' | 'resfile' | (string & {})
  /**
   * Check if the resource child folder exists in the project.
   */
  isExist(): Promise<boolean>
  /**
   * Check if the element folder exists in the resource child folder.
   *
   * ```txt
   * |-- src
   * |  |-- main
   * |  |  |-- resources
   * |  |  |  |-- base
   * |  |  |  |  |-- element <-- check this folder is exist
   * |  |  |  |  |-- ...
   * |  |  |  |-- ...
   * |  |-- ...
   * ```
   *
   * @param force - If true, the element folder will be read again. If not provided, the cached value will be returned.
   */
  readElementFolder(force?: boolean): Promise<false | ElementJsonFile[]>
  /**
   * Get the element folder path in the resource child folder.
   */
  getElementFolderPath(): Promise<URI>
}

export interface ModuleOpenHarmonyProject extends OpenHarmonyProject {
  /**
   * The project type.
   */
  projectType: 'module'
  /**
   * Read the module.json5 file. If the file does not exist, return null.
   *
   * ```txt
   * |-- src
   * |  |-- main
   * |  |  |-- module.json5 <-- read this file
   * |  |-- mock
   * |  |-- test
   * |  |-- ...
   * ```
   */
  readModuleJson5(): Promise<DeepPartial<ModuleJson5> | null>
  /**
   * Check if the main folder exists in the project.
   *
   * ```txt
   * |-- src
   * |  |-- main <-- check this folder is exist
   * |  |  |-- ets
   * |  |  |-- resources
   * |  |  |-- module.json5
   * |  |-- mock
   * |  |-- test
   * |  |-- ...
   */
  isExistMainFolder(): Promise<boolean>
  /**
   * Check if the src folder exists in the project.
   *
   * ```txt
   * |-- src <-- check this folder is exist
   * |  |-- main
   * |  |-- mock
   * |  |-- test
   * |  |-- ...
   */
  isExistSourceFolder(): Promise<boolean>
  /**
   * Check if the resources folder exists in the project.
   *
   * ```txt
   * |-- src
   * |  |-- main
   * |  |  |-- ets
   * |  |  |-- resources <-- check this folder is exist
   * |  |-- ...
   */
  isExistResourceFolder(): Promise<boolean>
  /**
   * Check if the resource child folder exists in the project.
   *
   * ```txt
   * |-- src
   * |  |-- main
   * |  |  |-- resources
   * |  |  |  |-- base <---- check those folder is exist
   * |  |  |  |-- dark    |
   * |  |  |  |-- rawfile |
   * |  |  |  |-- resfile |
   * |  |  |  |-- en_US   |
   * |  |  |  |-- ...  ---|
   * |  |-- ...
   */
  readResourceChildFolder(force?: boolean): Promise<ResourceChildFolder[] | false>
  /**
   * Reset the project state & clear the cache.
   *
   * @param resetTypes - The types of the project state to reset. If not provided, all types will be reset.
   */
  reset(resetTypes?: readonly ModuleOpenHarmonyProject.ResetType[]): Promise<void>
  /**
   * - Check if the project is a valid module level project.
   *
   * @inheritdoc
   */
  is(): Promise<boolean>
}

export namespace ModuleOpenHarmonyProject {
  export function is(value: unknown): value is ModuleOpenHarmonyProject {
    return value instanceof ModuleOpenHarmonyProjectImpl
  }
}

export namespace ModuleOpenHarmonyProject {
  export type ResetType = 'module.json5' | 'main' | 'src' | OpenHarmonyProject.ResetType
}

export interface WorkspaceOpenHarmonyProject extends OpenHarmonyProject {
  /**
   * The project type.
   */
  projectType: 'workspace'
  /**
   * Get the children module level projects.
   *
   * ```txt
   * |-- src
   * |  |-- main
   * |  |-- mock
   * |  |-- test
   * |  |-- ...
   * ```
   */
  getChildrenProjects(): Promise<ModuleOpenHarmonyProject[]>
  /**
   * - Check if the project is a valid workspace level project.
   *
   * @inheritdoc
   */
  is(): Promise<boolean>
}

export namespace WorkspaceOpenHarmonyProject {
  export function is(value: unknown): value is WorkspaceOpenHarmonyProject {
    return value instanceof WorkspaceOpenHarmonyProjectImpl
  }
}

export namespace WorkspaceOpenHarmonyProject {
  export type ResetType = OpenHarmonyProject.ResetType
}
