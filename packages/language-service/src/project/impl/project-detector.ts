import type { ElementJsonFile } from '../project'
import type { OpenHarmonyProjectDetector, ProjectDetectorOptions } from '../project-detector'
import type { FileSystemAdapter } from '../proto/fs'
import path from 'node:path'
import { LanguageServerLogger } from '@arkts/shared'
import { URI } from 'vscode-uri'
import { AbstractFileSystem } from '../common'
import { ModuleOpenHarmonyProject, OpenHarmonyProject } from '../project'
import { FileSystemWrapper } from './file-system-wrapper'
import { createNodeFileSystemAdapter } from './node-file-system'

export class OpenHarmonyProjectDetectorImpl extends AbstractFileSystem implements OpenHarmonyProjectDetector, AbstractFileSystem {
  constructor(
    private readonly workspaceFolder: URI,
    private readonly options: ProjectDetectorOptions = {},
  ) { super() }

  private _fileSystem: FileSystemAdapter | null = null

  async getFileSystem(): Promise<FileSystemAdapter> {
    if (!this._fileSystem)
      this._fileSystem = new FileSystemWrapper(this.options.fs ?? await createNodeFileSystemAdapter(), this)
    return this._fileSystem
  }

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
    const fs = await this.getFileSystem()

    if (!(await fs.exists(workspaceFolder)) || !(await fs.stat(workspaceFolder)).isDirectory())
      return []
    const pattern = path.resolve(workspaceFolder, '**', 'oh-package.json5')
    const ohPackageJson5Files = await fs.glob(pattern, {
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
      const openHarmonyModules = await project.readOpenHarmonyModules(force)
      for (const openHarmonyModule of openHarmonyModules) {
        const resourceFolders = await openHarmonyModule.readResourceFolder(force)
        if (!resourceFolders)
          continue
        let foundElementFile: ElementJsonFile | null = null
        for (const resourceFolder of resourceFolders) {
          if (filePath.toString().startsWith(resourceFolder.getUri().toString())) {
            const elementFolder = await resourceFolder.readElementFolder(force)
            if (!elementFolder)
              continue
            const currentFoundElementFile = elementFolder.find(elementFile => filePath.toString() === elementFile.getUri().toString())
            if (currentFoundElementFile)
              foundElementFile = currentFoundElementFile
          }
        }
        return foundElementFile
      }
    }

    return null
  }

  async searchResourceElementRange(elementKind: ElementJsonFile.ElementKind, name: string, ets: typeof import('ohos-typescript'), force?: boolean): Promise<ElementJsonFile.NameRange[] | null> {
    const projects = await this.findProjects(force)
    const nameRanges: ElementJsonFile.NameRange[] = []

    for (const project of projects) {
      if (!ModuleOpenHarmonyProject.is(project))
        continue

      const openHarmonyModules = await project.readOpenHarmonyModules(force)

      for (const openHarmonyModule of openHarmonyModules) {
        const resourceFolders = await openHarmonyModule.readResourceFolder(force)
        if (!resourceFolders)
          continue

        for (const resourceFolder of resourceFolders) {
          const elementFolder = await resourceFolder.readElementFolder(force)
          if (!elementFolder)
            continue

          for (const elementFile of elementFolder) {
            const elementNameRanges = await elementFile.getNameRange(ets, force)

            for (const elementNameRange of elementNameRanges) {
              if (elementNameRange.text === name && elementNameRange.kind === elementKind)
                nameRanges.push(elementNameRange)
            }
          }
        }
      }
    }

    return nameRanges
  }

  async searchProjectByModuleJson5<T = ModuleOpenHarmonyProject>(filePath: URI, ets: typeof import('ohos-typescript'), force: boolean = false): Promise<T | null> {
    const projects = await this.findProjects(force)
    for (const project of projects) {
      if (!ModuleOpenHarmonyProject.is(project))
        continue

      const openHarmonyModules = await project.readOpenHarmonyModules(force)

      for (const openHarmonyModule of openHarmonyModules) {
        const moduleJson5SourceFile = await openHarmonyModule.readModuleJson5SourceFile(ets, force)
        if (!moduleJson5SourceFile)
          continue
        if (moduleJson5SourceFile.fileName !== filePath.fsPath)
          continue
        return project as T
      }
    }
    return null
  }

  async getResourceReferenceByFilePath(filePath: URI, ets: typeof import('ohos-typescript'), force: boolean = false): Promise<ElementJsonFile.NameRangeReference[]> {
    const project: ModuleOpenHarmonyProject | null = await this.searchProject(URI.file(filePath.fsPath), 'module', force)
    if (!project)
      return []
    const openHarmonyModules = await project.readOpenHarmonyModules(force)
    const openHarmonyModule = openHarmonyModules.find(openHarmonyModule => filePath.toString().startsWith(openHarmonyModule.getModulePath().toString()))
    if (!openHarmonyModule)
      return []
    return openHarmonyModule.groupByResourceReference(ets, force)
  }

  private _force: boolean = false

  setForce(force: boolean): void {
    this._force = force
  }

  getForce(): boolean {
    return this._force
  }
}
