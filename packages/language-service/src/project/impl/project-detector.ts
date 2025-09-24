import type { OpenHarmonyProjectDetector } from '../project-detector'
import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import { URI } from 'vscode-uri'
import { toPattern } from '../../utils/to-pattern'
import { ModuleOpenHarmonyProject, OpenHarmonyProject } from '../project'

export class OpenHarmonyProjectDetectorImpl implements OpenHarmonyProjectDetector {
  constructor(private readonly workspaceFolder: URI) {}

  getWorkspaceFolder(): URI {
    return this.workspaceFolder
  }

  private _projects: OpenHarmonyProject[] | null = null

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
  ], force: boolean = false): Promise<OpenHarmonyProject[]> {
    if (!force && this._projects)
      return this._projects
    const workspaceFolder = this.getWorkspaceFolder().fsPath
    if (!fs.existsSync(workspaceFolder) || !fs.statSync(workspaceFolder).isDirectory())
      return []
    const pattern = toPattern(path.resolve(workspaceFolder, '**', 'oh-package.json5'))
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
    this._projects = projects
    return projects
  }

  async searchProject<InstanceType extends string>(filePath: URI, instanceType?: InstanceType): Promise<any | null> {
    const projects = await this.findProjects()
    for (const project of projects) {
      if (!filePath.fsPath.startsWith(project.getProjectRoot().fsPath))
        continue
      if (!instanceType)
        return project
      if (!ModuleOpenHarmonyProject.is(project))
        continue
      if (!ModuleOpenHarmonyProject.is(project))
        continue
      return project
    }
    return null
  }
}
