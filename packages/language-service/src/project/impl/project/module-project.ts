import type { ModuleOpenHarmonyProject, OpenHarmonyModule } from '../../project'
import fs from 'node:fs'
import path from 'node:path'
import { URI } from 'vscode-uri'
import { OpenHarmonyModuleImpl } from '../folder/module'
import { OpenHarmonyProjectImpl } from './abstract-project'

export class ModuleOpenHarmonyProjectImpl extends OpenHarmonyProjectImpl implements ModuleOpenHarmonyProject {
  projectType = 'module' as const

  static readonly defaultResetTypes: readonly ModuleOpenHarmonyProject.ResetType[] = [
    'build-profile.json5',
    'main',
    'module.json5',
    'oh-package.json5',
    'src',
  ]

  private _sourceFolderExists: boolean | null = null

  async isExistSourceFolder(): Promise<boolean> {
    if (this._sourceFolderExists !== null)
      return this._sourceFolderExists
    const sourceFolderPath = path.resolve(this.getProjectRoot().fsPath, 'src')
    this.getProjectDetector()
      .getLogger('ProjectDetector/ModuleOpenHarmonyProject/isExistSourceFolder')
      .getConsola()
      .info(`Check src folder: ${sourceFolderPath}`)
    this._sourceFolderExists = fs.existsSync(sourceFolderPath) && fs.statSync(sourceFolderPath).isDirectory()
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
    this.openHarmonyModules = fs.readdirSync(sourceFolderPath)
      .filter(filename => fs.statSync(path.resolve(sourceFolderPath, filename)).isDirectory())
      .filter(foldername => fs.existsSync(path.resolve(sourceFolderPath, foldername, 'module.json5')) && fs.statSync(path.resolve(sourceFolderPath, foldername, 'module.json5')).isFile())
      .map(filename => new OpenHarmonyModuleImpl(this, URI.file(path.resolve(sourceFolderPath, filename))))
    return this.openHarmonyModules
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
