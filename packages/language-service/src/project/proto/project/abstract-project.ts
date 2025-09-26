import type { URI } from 'vscode-uri'
import type { BuildProfile } from '../../../types/build-profile'
import type { OhPackageJson5 } from '../../../types/oh-package5'
import type { DeepPartial } from '../../../types/util'
import type { OpenHarmonyProjectDetector } from '../../project-detector'
import type { Resetable } from '../common'
import { ModuleOpenHarmonyProjectImpl } from '../../impl/project/module-project'
import { OpenHarmonyProjectImpl } from '../../impl/project/abstract-project'
import { WorkspaceOpenHarmonyProjectImpl } from '../../impl/project/workspace-project'

export interface OpenHarmonyProject extends Resetable {
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
