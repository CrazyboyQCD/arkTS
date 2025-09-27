import type { ModuleOpenHarmonyProject, OpenHarmonyModule } from '../../project'
import path from 'node:path'
import { URI } from 'vscode-uri'
import { OpenHarmonyModuleImpl } from '../folder/module'
import { OpenHarmonyProjectImpl } from './abstract-project'

export class ModuleOpenHarmonyProjectImpl extends OpenHarmonyProjectImpl implements ModuleOpenHarmonyProject {
  projectType = 'module' as const

  static readonly defaultResetTypes: readonly ModuleOpenHarmonyProject.ResetType[] = [
    'build-profile.json5',
    'oh-package.json5',
    'src',
  ]

  private _sourceFolderExists: boolean | null = null

  async isExistSourceFolder(): Promise<boolean> {
    if (this._sourceFolderExists !== null)
      return this._sourceFolderExists
    const sourceFolderPath = path.resolve(this.getProjectRoot().fsPath, 'src')
    const fs = await this.getProjectDetector().getFileSystem()
    this.getProjectDetector()
      .getLogger('ProjectDetector/ModuleOpenHarmonyProject/isExistSourceFolder')
      .getConsola()
      .info(`Check src folder: ${sourceFolderPath}`)
    this._sourceFolderExists = await fs.exists(sourceFolderPath) && (await fs.stat(sourceFolderPath)).isDirectory()
    return this._sourceFolderExists
  }

  private openHarmonyModules: OpenHarmonyModule[] | null = null

  async readOpenHarmonyModules(force: boolean = false): Promise<OpenHarmonyModule[]> {
    if (this.openHarmonyModules !== null && !force)
      return this.openHarmonyModules
    const sourceFolderPath = path.resolve(this.getProjectRoot().fsPath, 'src')
    this.getProjectDetector()
      .getLogger('ProjectDetector/ModuleOpenHarmonyProject/readOpenHarmonyModules')
      .getConsola()
      .info(`Read open harmony modules: ${sourceFolderPath}`)
    const fs = await this.getProjectDetector().getFileSystem()

    const directoryFiles = await fs.readdir(sourceFolderPath)

    if (directoryFiles.length > 0) {
      if (!this.openHarmonyModules)
        this.openHarmonyModules = []

      for (const filename of directoryFiles) {
        const filePath = path.resolve(sourceFolderPath, filename)
        if (await fs.exists(filePath) && (await fs.stat(filePath)).isDirectory()) {
          this.openHarmonyModules.push(new OpenHarmonyModuleImpl(this, URI.file(filePath)))
        }
      }

      return this.openHarmonyModules
    }

    return []
  }

  async reset(resetTypes: readonly ModuleOpenHarmonyProject.ResetType[] = ModuleOpenHarmonyProjectImpl.defaultResetTypes): Promise<void> {
    if (resetTypes?.includes('src')) {
      this._sourceFolderExists = null
      this.getProjectDetector()
        .getLogger('ProjectDetector/ModuleOpenHarmonyProject/reset')
        .getConsola()
        .info(`Reset project: ${this.getProjectRoot().toString()}, src`)
    }
    await super.reset(resetTypes)
  }

  async is(): Promise<boolean> {
    return await this.isExistSourceFolder()
      && await super.is()
  }
}
