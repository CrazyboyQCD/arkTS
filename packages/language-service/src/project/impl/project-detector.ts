import type { OpenHarmonyProjectDetector } from '../project-detector'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import fg from 'fast-glob'
import { URI } from 'vscode-uri'
import { OpenHarmonyProject } from '../project'

export class OpenHarmonyProjectDetectorImpl implements OpenHarmonyProjectDetector {
  constructor(private readonly workspaceFolder: URI) {}

  getWorkspaceFolder(): URI {
    return this.workspaceFolder
  }

  private toPattern(path: string): string {
    return process.platform === 'win32' ? fg.convertPathToPattern(path) : path
  }

  /**
   * Find the projects in the workspace folder.
   *
   * @param ignore - The ignore patterns. default will exclude the `node_modules`, `oh_modules`, and `.git` folders.
   * @returns The projects in the workspace folder.
   */
  async findProjects(ignore: string[] = [
    '**/node_modules/**',
    '**/oh_modules/**',
    '**/.git/**',
  ]): Promise<OpenHarmonyProject[]> {
    const workspaceFolder = this.getWorkspaceFolder().fsPath
    if (!fs.existsSync(workspaceFolder) || !fs.statSync(workspaceFolder).isDirectory())
      return []
    const pattern = this.toPattern(path.resolve(workspaceFolder, '**', 'oh-package.json5'))
    const ohPackageJson5Files = fg.sync(pattern, {
      onlyFiles: true,
      onlyDirectories: false,
      absolute: true,
      ignore,
    })

    const projects: OpenHarmonyProject[] = []
    for (const ohPackageJson5File of ohPackageJson5Files) {
      const project = await OpenHarmonyProject.isProject(URI.file(path.dirname(ohPackageJson5File)), this)
      if (project)
        projects.push(project)
    }
    return projects
  }
}
