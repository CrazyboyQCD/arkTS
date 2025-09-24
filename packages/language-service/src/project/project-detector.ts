import type { URI } from 'vscode-uri'
import type { OpenHarmonyProject } from './project'
import { OpenHarmonyProjectDetectorImpl } from './impl/project-detector'

export interface OpenHarmonyProjectDetector {
  /** Get the workspace folder. */
  getWorkspaceFolder(): URI
  /** Find all projects in the workspace. */
  findProjects(): Promise<OpenHarmonyProject[]>
}

export function createOpenHarmonyProjectDetector(workspaceFolder: URI): OpenHarmonyProjectDetector {
  return new OpenHarmonyProjectDetectorImpl(workspaceFolder)
}
