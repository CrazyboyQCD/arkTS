import type { URI } from 'vscode-uri'
import type { ModuleOpenHarmonyProject, OpenHarmonyProject, WorkspaceOpenHarmonyProject } from './project'
import { OpenHarmonyProjectDetectorImpl } from './impl/project-detector'

export interface OpenHarmonyProjectDetector {
  /** Get the workspace folder. */
  getWorkspaceFolder(): URI
  /** Find all projects in the workspace. */
  findProjects(): Promise<OpenHarmonyProject[]>
  /** Search the project by the file path. */
  searchProject<InstanceType extends 'module' | 'workspace'>(filePath: URI, instanceType?: InstanceType): Promise<
    (InstanceType extends 'module'
      ? ModuleOpenHarmonyProject
      : InstanceType extends 'workspace'
        ? WorkspaceOpenHarmonyProject
        : OpenHarmonyProject) | null
  >
}

export function createOpenHarmonyProjectDetector(workspaceFolder: URI): OpenHarmonyProjectDetector {
  return new OpenHarmonyProjectDetectorImpl(workspaceFolder)
}
