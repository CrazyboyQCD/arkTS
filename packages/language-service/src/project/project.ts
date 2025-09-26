import type { Position } from '@volar/language-server'
import type { URI } from 'vscode-uri'
import type { BuildProfile } from '../types/build-profile'
import type { OhPackageJson5 } from '../types/oh-package5'
import type { ResourceElementFile } from '../types/resource-element-file'
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
   * Get the project detector.
   */
  getProjectDetector(): OpenHarmonyProjectDetector
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
    if (await moduleProject.is()) {
      projectDetector.getLogger('ProjectDetector/ModuleProject').getConsola().info(`Project created: ${moduleProject.getProjectRoot().toString()}`)
      return moduleProject
    }
    const workspaceProject = new WorkspaceOpenHarmonyProjectImpl(projectRoot, projectDetector)
    if (await workspaceProject.is()) {
      projectDetector.getLogger('ProjectDetector/WorkspaceProject').getConsola().info(`Project created: ${workspaceProject.getProjectRoot().toString()}`)
      return workspaceProject
    }
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
    uri: URI
  }

  export interface NameRangeReference {
    name: string
    references: NameRange[]
  }
}

export interface ResourceMediaFile {
  /**
   * Get the element media file URI.
   */
  getUri(): URI
  /**
   * Get the resource child folder.
   */
  getResourceFolder(): ResourceFolder
  /**
   * Check if the element media file exists in the resource child folder.
   */
  isExist(force?: boolean): Promise<boolean>
}

export interface ResourceRawFile {
  /**
   * Get the resource raw file URI.
   */
  getUri(): URI
  /**
   * Get the resource child folder.
   */
  getResourceFolder(): ResourceFolder
  /**
   * Check if the resource raw file exists in the resource child folder.
   */
  isExist(force?: boolean): Promise<boolean>
  /**
   * Get the relative path of the resource raw file.
   */
  getRelativePath(): string
  /**
   * Get the completion text of the resource raw file.
   */
  getCompletionText(currentInput: string): string
}

export interface ResourceFolder {
  /**
   * Get the open harmony module.
   */
  getOpenHarmonyModule(): OpenHarmonyModule
  /**
   * Get the resource child folder URI.
   */
  getUri(): URI
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
  /**
   * Reset the resource folder state & clear the cache.
   */
  reset(): Promise<void>
}

export interface OpenHarmonyModule {
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
   * Group the resource reference by the element kind and name.
   *
   * @param ets - The ohos typescript instance.
   * @param force - If true, the resource reference will be read again. If not provided, the cached value will be returned.
   */
  groupByResourceReference(ets: typeof import('ohos-typescript'), force?: boolean): Promise<ElementJsonFile.NameRangeReference[]>
}

export interface ModuleOpenHarmonyProject extends OpenHarmonyProject {
  /**
   * The project type.
   */
  projectType: 'module'
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
   * Read the open harmony modules in the project.
   *
   * @param force - If true, the open harmony modules will be read again. If not provided, the cached value will be returned.
   */
  readOpenHarmonyModules(force?: boolean): Promise<OpenHarmonyModule[]>
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
  export type ResetType = 'src' | OpenHarmonyProject.ResetType
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
