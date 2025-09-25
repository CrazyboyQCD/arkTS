import type { LanguageServerLogger } from '@arkts/shared'
import type { URI } from 'vscode-uri'
import type { ModuleOpenHarmonyProject, OpenHarmonyProject, WorkspaceOpenHarmonyProject } from './project'
import { OpenHarmonyProjectDetectorImpl } from './impl/project-detector'

export interface OpenHarmonyProjectDetector {
  /** Get the logger. */
  getLogger(prefix?: string): LanguageServerLogger
  /** Get the workspace folder. */
  getWorkspaceFolder(): URI
  /**
   * Find all projects in the workspace.
   * @param force - Whether to force find the projects.
   */
  findProjects(force?: boolean): Promise<OpenHarmonyProject[]>
  /** Search the project by the file path. */
  searchProject<InstanceType extends 'module' | 'workspace'>(filePath: URI, instanceType?: InstanceType, force?: boolean): Promise<
    (InstanceType extends 'module'
      ? ModuleOpenHarmonyProject
      : InstanceType extends 'workspace'
        ? WorkspaceOpenHarmonyProject
        : OpenHarmonyProject) | null
  >
  setForce(force: boolean): void
  getForce(): boolean
  update(uri: URI): Promise<void>
}

export function createOpenHarmonyProjectDetector(workspaceFolder: URI): OpenHarmonyProjectDetector {
  return new OpenHarmonyProjectDetectorImpl(workspaceFolder)
}
