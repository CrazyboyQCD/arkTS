import type { OpenHarmonyModule } from '../folder/module'
import type { OpenHarmonyProject } from './abstract-project'
import { ModuleOpenHarmonyProjectImpl } from '../../impl/project/module-project'

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
