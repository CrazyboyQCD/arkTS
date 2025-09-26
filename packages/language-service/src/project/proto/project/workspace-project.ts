import type { OpenHarmonyProject } from './abstract-project'
import type { ModuleOpenHarmonyProject } from './module-project'
import { WorkspaceOpenHarmonyProjectImpl } from '../../impl/project/workspace-project'

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
