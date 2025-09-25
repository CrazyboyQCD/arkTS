import type { ModuleJson5 } from '../../types/module-json5'
import type { DeepPartial } from '../../types/util'
import type { ModuleOpenHarmonyProject, ResourceFolder } from '../project'
import fs from 'node:fs'
import path from 'node:path'
import json5 from 'json5'
import { URI } from 'vscode-uri'
import { OpenHarmonyProjectImpl } from './openharmony-project'
import { ResourceChildFolderImpl } from './resource-detector'

export class ModuleOpenHarmonyProjectImpl extends OpenHarmonyProjectImpl implements ModuleOpenHarmonyProject {
  projectType = 'module' as const

  static readonly defaultResetTypes: readonly ModuleOpenHarmonyProject.ResetType[] = [
    'build-profile.json5',
    'main',
    'module.json5',
    'oh-package.json5',
    'src',
  ]

  private _moduleJson5Path = path.resolve(this.getProjectRoot().fsPath, 'src', 'main', 'module.json5')

  getModuleJson5Path(): string {
    return this._moduleJson5Path
  }

  private _moduleJson5: string | null = null

  async readModuleJson5Text(force: boolean = false): Promise<string | null> {
    if (this._moduleJson5 !== null && !force)
      return this._moduleJson5
    const moduleJson5Path = this.getModuleJson5Path()

    try {
      if (!fs.existsSync(moduleJson5Path) || !fs.statSync(moduleJson5Path).isFile())
        return null
      this.getProjectDetector()
        .getLogger('ProjectDetector/ModuleOpenHarmonyProject/readModuleJson5')
        .getConsola()
        .info(`Read module.json5: ${moduleJson5Path}`)
      this._moduleJson5 = fs.readFileSync(moduleJson5Path, 'utf-8')
      return this._moduleJson5
    }
    catch (error) {
      console.error(`Read ${moduleJson5Path} failed, error:`, error)
      return null
    }
  }

  private _moduleJson5Parsed: DeepPartial<ModuleJson5> | null = null

  async safeParseModuleJson5(force: boolean = false): Promise<DeepPartial<ModuleJson5> | null> {
    if (this._moduleJson5Parsed !== null && !force)
      return this._moduleJson5Parsed
    const moduleJson5 = await this.readModuleJson5Text(force)
    if (moduleJson5 === null)
      return null

    try {
      this._moduleJson5Parsed = json5.parse(moduleJson5)
      return this._moduleJson5Parsed
    }
    catch (error) {
      this.getProjectDetector()
        .getLogger('ProjectDetector/ModuleOpenHarmonyProject/safeParseModuleJson5')
        .getConsola()
        .error(`Parse module.json5 failed, error:`, error)
      return null
    }
  }

  private _moduleJson5SourceFile: import('ohos-typescript').JsonSourceFile | null = null

  async readModuleJson5SourceFile(ets: typeof import('ohos-typescript'), force: boolean = false): Promise<import('ohos-typescript').JsonSourceFile | null> {
    if (this._moduleJson5SourceFile !== null && !force)
      return this._moduleJson5SourceFile
    const moduleJson5 = await this.readModuleJson5Text(force)
    if (moduleJson5 === null)
      return null
    this._moduleJson5SourceFile = ets.parseJsonText(this.getModuleJson5Path(), moduleJson5)
    return this._moduleJson5SourceFile
  }

  private _mainFolderExists: boolean | null = null

  async isExistMainFolder(): Promise<boolean> {
    if (this._mainFolderExists !== null)
      return this._mainFolderExists
    const mainFolderPath = path.resolve(this.getProjectRoot().fsPath, 'src', 'main')
    this.getProjectDetector()
      .getLogger('ProjectDetector/ModuleOpenHarmonyProject/isExistMainFolder')
      .getConsola()
      .info(`Check main folder: ${mainFolderPath}`)
    this._mainFolderExists = fs.existsSync(mainFolderPath) && fs.statSync(mainFolderPath).isDirectory()
    return this._mainFolderExists
  }

  private _baseFolderExists: false | ResourceFolder[] | null = null

  async readResourceFolder(force: boolean = false): Promise<ResourceFolder[] | false> {
    if (this._baseFolderExists !== null && !force)
      return this._baseFolderExists
    const resourceFolderPath = path.resolve(this.getProjectRoot().fsPath, 'src', 'main', 'resources')
    if (!fs.existsSync(resourceFolderPath) || !fs.statSync(resourceFolderPath).isDirectory())
      return false
    this.getProjectDetector()
      .getLogger('ProjectDetector/ModuleOpenHarmonyProject/readResourceFolder')
      .getConsola()
      .info(`Readed resource folder: ${resourceFolderPath}`)
    this._baseFolderExists = fs.readdirSync(resourceFolderPath).map(
      filename => new ResourceChildFolderImpl(URI.file(path.resolve(resourceFolderPath, filename)), this),
    )
    return this._baseFolderExists
  }

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

  async reset(resetTypes: readonly ModuleOpenHarmonyProject.ResetType[] = ModuleOpenHarmonyProjectImpl.defaultResetTypes): Promise<void> {
    if (resetTypes?.includes('module.json5')) {
      this._moduleJson5 = null
      this.getProjectDetector()
        .getLogger('ProjectDetector/ModuleOpenHarmonyProject/reset')
        .getConsola()
        .info(`Reset project: ${this.getProjectRoot().toString()}, module.json5`)
    }
    if (resetTypes?.includes('main')) {
      this._mainFolderExists = null
      this.getProjectDetector()
        .getLogger('ProjectDetector/ModuleOpenHarmonyProject/reset')
        .getConsola()
        .info(`Reset project: ${this.getProjectRoot().toString()}, main`)
    }
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
    return await this.isExistMainFolder()
      && await this.isExistSourceFolder()
      && await this.safeParseModuleJson5() !== null
      && await super.is()
  }
}
