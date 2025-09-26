import type { ModuleJson5 } from '../../types/module-json5'
import type { DeepPartial } from '../../types/util'
import type { ElementJsonFile, ModuleOpenHarmonyProject, OpenHarmonyModule, ResourceFolder } from '../project'
import fs from 'node:fs'
import path from 'node:path'
import json5 from 'json5'
import { URI, Utils } from 'vscode-uri'
import { ResourceChildFolderImpl } from './resource-detector'

export class OpenHarmonyModuleImpl implements OpenHarmonyModule {
  constructor(
    private readonly moduleOpenHarmonyProject: ModuleOpenHarmonyProject,
    private readonly modulePath: URI,
  ) {}

  getModuleOpenHarmonyProject(): ModuleOpenHarmonyProject {
    return this.moduleOpenHarmonyProject
  }

  getModulePath(): URI {
    return this.modulePath
  }

  getModuleJson5Path(): URI {
    return Utils.joinPath(this.modulePath, 'module.json5')
  }

  private _moduleJson5: string | null = null

  async readModuleJson5Text(force: boolean = false): Promise<string | null> {
    if (this._moduleJson5 !== null && !force)
      return this._moduleJson5
    const moduleJson5Path = this.getModuleJson5Path().fsPath

    try {
      if (!fs.existsSync(moduleJson5Path) || !fs.statSync(moduleJson5Path).isFile())
        return null
      this.getModuleOpenHarmonyProject()
        .getProjectDetector()
        .getLogger('ProjectDetector/OpenHarmonyModule/readModuleJson5')
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
      this.getModuleOpenHarmonyProject()
        .getProjectDetector()
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
    this._moduleJson5SourceFile = ets.parseJsonText(this.getModuleJson5Path().fsPath, moduleJson5)
    return this._moduleJson5SourceFile
  }

  private _baseFolderExists: false | ResourceFolder[] | null = null

  async readResourceFolder(force: boolean = false): Promise<ResourceFolder[] | false> {
    if (this._baseFolderExists !== null && !force)
      return this._baseFolderExists
    const resourceFolderPath = Utils.joinPath(this.getModulePath(), 'resources')
    if (!fs.existsSync(resourceFolderPath.fsPath) || !fs.statSync(resourceFolderPath.fsPath).isDirectory())
      return false
    this.getModuleOpenHarmonyProject()
      .getProjectDetector()
      .getLogger('ProjectDetector/ModuleOpenHarmonyProject/readResourceFolder')
      .getConsola()
      .info(`Readed resource folder: ${resourceFolderPath.fsPath}`)
    this._baseFolderExists = fs.readdirSync(resourceFolderPath.fsPath).map(
      filename => new ResourceChildFolderImpl(URI.file(path.resolve(resourceFolderPath.fsPath, filename)), this),
    )
    return this._baseFolderExists
  }

  async groupByResourceReference(ets: typeof import('ohos-typescript'), force: boolean = false): Promise<ElementJsonFile.NameRangeReference[]> {
    const resourceFolder = await this.readResourceFolder(force)
    if (resourceFolder === false)
      return []
    return Promise.all(
      resourceFolder
        .filter(folder => folder.isElementFolder())
        .map(folder => folder.getElementNameRangeReference(ets, force)),
    )
      .then(references => references.flat())
      .then(
        references => references.reduce<ElementJsonFile.NameRangeReference[]>((acc, reference) => {
          const foundIndex = acc.findIndex(item => item.name === reference.name)
          if (foundIndex === -1)
            acc.push(reference)
          return acc
        }, []),
      )
  }
}
