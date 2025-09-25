import type { ElementJsonFile } from '../project'
import type { OpenHarmonyProjectDetector } from '../project-detector'
import fs from 'node:fs'
import path from 'node:path'
import { LanguageServerLogger } from '@arkts/shared'
import fg from 'fast-glob'
import { URI } from 'vscode-uri'
import { toPattern } from '../../utils/to-pattern'
import { ModuleOpenHarmonyProject, OpenHarmonyProject } from '../project'

export class OpenHarmonyProjectDetectorImpl implements OpenHarmonyProjectDetector {
  constructor(private readonly workspaceFolder: URI) {}

  getWorkspaceFolder(): URI {
    return this.workspaceFolder
  }

  private _loggers: Record<string, LanguageServerLogger> = {}

  getLogger(prefix: string = 'ProjectDetector'): LanguageServerLogger {
    this._loggers[prefix] = this._loggers[prefix] ?? new LanguageServerLogger(prefix)
    return this._loggers[prefix]
  }

  private _projects: OpenHarmonyProject[] | null = null

  /**
   * Find the projects in the workspace folder.
   *
   * @param force - Whether to force find the projects.
   * @param ignore - The ignore patterns. default will exclude the `node_modules`, `oh_modules`, and `.git` folders.
   * @returns The projects in the workspace folder.
   */
  async findProjects(force: boolean = false, ignore: string[] = [
    '**/node_modules/**',
    '**/oh_modules/**',
    '**/.git/**',
  ]): Promise<OpenHarmonyProject[]> {
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

  async searchProject<InstanceType extends string>(filePath: URI, instanceType?: InstanceType, force: boolean = false): Promise<any | null> {
    const projects = await this.findProjects(force)
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

  async searchResourceElementFile(filePath: URI, force: boolean = false): Promise<ElementJsonFile | null> {
    const projects = await this.findProjects(force)

    for (const project of projects) {
      if (!filePath.fsPath.startsWith(project.getProjectRoot().fsPath))
        continue
      if (!ModuleOpenHarmonyProject.is(project))
        continue
      const resourceFolders = await project.readResourceFolder()
      if (!resourceFolders)
        continue
      let foundElementFile: ElementJsonFile | null = null
      for (const resourceFolder of resourceFolders) {
        if (filePath.toString().startsWith(resourceFolder.getUri().toString())) {
          const elementFolder = await resourceFolder.readElementFolder()
          if (!elementFolder)
            continue
          const currentFoundElementFile = elementFolder.find(elementFile => filePath.toString() === elementFile.getUri().toString())
          if (currentFoundElementFile)
            foundElementFile = currentFoundElementFile
        }
      }
      return foundElementFile
    }

    return null
  }

  private _force: boolean = false

  setForce(force: boolean): void {
    this._force = force
  }

  getForce(): boolean {
    return this._force
  }

  async update(uri: URI): Promise<void> {
    const projects = await this.findProjects()

    for (const project of projects) {
      if (uri.toString() === project.getProjectRoot().toString()) {
        await project.reset()
        continue
      }

      if (ModuleOpenHarmonyProject.is(project)) {
        const resourceFolders = await project.readResourceFolder()
        if (!resourceFolders)
          continue

        for (const resourceFolder of resourceFolders) {
          if (uri.toString().startsWith(resourceFolder.getUri().toString())) {
            await resourceFolder.reset()
            continue
          }
        }
      }
    }
  }
}
