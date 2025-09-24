import type { ModuleJson5 } from '../../types/module-json5'
import type { DeepPartial } from '../../types/util'
import type { ModuleOpenHarmonyProject, ResourceChildFolder } from '../project'
import fs from 'node:fs'
import path from 'node:path'
import json5 from 'json5'
import { URI } from 'vscode-uri'
import { OpenHarmonyProjectImpl } from './openharmony-project'
import { ResourceChildFolderImpl } from './resource-detector'

export class ModuleOpenHarmonyProjectImpl extends OpenHarmonyProjectImpl implements ModuleOpenHarmonyProject {
  projectType = 'module' as const

  private _moduleJson5: DeepPartial<ModuleJson5> | null = null

  static readonly defaultResetTypes: readonly ModuleOpenHarmonyProject.ResetType[] = [
    'build-profile.json5',
    'main',
    'module.json5',
    'oh-package.json5',
    'src',
  ]

  async readModuleJson5(): Promise<DeepPartial<ModuleJson5> | null> {
    if (this._moduleJson5 !== null)
      return this._moduleJson5
    const moduleJson5Path = path.resolve(this.getProjectRoot().fsPath, 'src', 'main', 'module.json5')

    try {
      if (!fs.existsSync(moduleJson5Path) || !fs.statSync(moduleJson5Path).isFile())
        return null
      const moduleJson5 = fs.readFileSync(moduleJson5Path, 'utf-8')
      const moduleJson = json5.parse(moduleJson5)
      this._moduleJson5 = moduleJson
      return moduleJson
    }
    catch (error) {
      console.error(`Read ${moduleJson5Path} failed, error:`, error)
      return null
    }
  }

  private _mainFolderExists: boolean | null = null

  async isExistMainFolder(): Promise<boolean> {
    if (this._mainFolderExists !== null)
      return this._mainFolderExists
    const mainFolderPath = path.resolve(this.getProjectRoot().fsPath, 'src', 'main')
    this._mainFolderExists = fs.existsSync(mainFolderPath) && fs.statSync(mainFolderPath).isDirectory()
    return this._mainFolderExists
  }

  private _resourceFolderExists: boolean | null = null

  async isExistResourceFolder(): Promise<boolean> {
    if (this._resourceFolderExists !== null)
      return this._resourceFolderExists
    const resourceFolderPath = path.resolve(this.getProjectRoot().fsPath, 'src', 'main', 'resources')
    this._resourceFolderExists = fs.existsSync(resourceFolderPath) && fs.statSync(resourceFolderPath).isDirectory()
    return this._resourceFolderExists
  }

  private _baseFolderExists: false | ResourceChildFolder[] | null = null

  async readResourceChildFolder(force: boolean = false): Promise<ResourceChildFolder[] | false> {
    if (this._baseFolderExists !== null && !force)
      return this._baseFolderExists
    const resourceFolderPath = path.resolve(this.getProjectRoot().fsPath, 'src', 'main', 'resources')
    if (!fs.existsSync(resourceFolderPath) || !fs.statSync(resourceFolderPath).isDirectory())
      return false
    this._baseFolderExists = fs.readdirSync(resourceFolderPath).map(
      filename => new ResourceChildFolderImpl(URI.file(path.resolve(resourceFolderPath, filename)), filename, this),
    )
    return this._baseFolderExists
  }

  private _sourceFolderExists: boolean | null = null

  async isExistSourceFolder(): Promise<boolean> {
    if (this._sourceFolderExists !== null)
      return this._sourceFolderExists
    const sourceFolderPath = path.resolve(this.getProjectRoot().fsPath, 'src')
    this._sourceFolderExists = fs.existsSync(sourceFolderPath) && fs.statSync(sourceFolderPath).isDirectory()
    return this._sourceFolderExists
  }

  async reset(resetTypes: readonly ModuleOpenHarmonyProject.ResetType[] = ModuleOpenHarmonyProjectImpl.defaultResetTypes): Promise<void> {
    if (resetTypes?.includes('module.json5'))
      this._moduleJson5 = null
    if (resetTypes?.includes('main'))
      this._mainFolderExists = null
    if (resetTypes?.includes('src'))
      this._sourceFolderExists = null
    await super.reset(resetTypes)
  }

  async is(): Promise<boolean> {
    return await this.isExistMainFolder()
      && await this.isExistSourceFolder()
      && await this.readModuleJson5() !== null
      && await super.is()
  }
}
