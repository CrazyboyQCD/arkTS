import type { ElementJsonFile, ModuleOpenHarmonyProject, ResourceChildFolder, ResourceMediaFile, ResourceRawFile } from '../project'
import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import { URI } from 'vscode-uri'
import { toPattern } from '../../utils/to-pattern'
import { ElementJsonFileImpl } from './element-json-file'
import { ResourceMediaFileImpl } from './element-media-file'
import { ResourceRawFileImpl } from './resource-raw-file'

export class ResourceChildFolderImpl implements ResourceChildFolder {
  constructor(
    private readonly resourceChildFolder: URI,
    private readonly moduleOpenHarmonyProject: ModuleOpenHarmonyProject,
  ) {}

  getModuleOpenHarmonyProject(): ModuleOpenHarmonyProject {
    return this.moduleOpenHarmonyProject
  }

  async isExist(): Promise<boolean> {
    return fs.existsSync(this.resourceChildFolder.fsPath) && fs.statSync(this.resourceChildFolder.fsPath).isDirectory()
  }

  getUri(): URI {
    return this.resourceChildFolder
  }

  getElementFolderPath(): URI {
    return URI.file(path.resolve(this.resourceChildFolder.fsPath, 'element'))
  }

  private _elementFolderExists: false | ElementJsonFile[] | null = null

  /**
   * Check if the element folder exists in the resource child folder.
   *
   * ```txt
   * |-- src
   * |  |-- main
   * |  |  |-- resources
   * |  |  |  |-- base
   * |  |  |  |  |-- element <-- check this folder is exist
   * |  |  |  |  |-- ...
   * |  |  |  |-- ...
   * |  |-- ...
   * ```
   */
  async readElementFolder(force: boolean = false): Promise<false | ElementJsonFile[]> {
    if (this._elementFolderExists !== null && !force)
      return this._elementFolderExists
    const elementFolderPath = this.getElementFolderPath()
    if (fs.existsSync(elementFolderPath.fsPath) && fs.statSync(elementFolderPath.fsPath).isDirectory()) {
      this._elementFolderExists = fs.readdirSync(elementFolderPath.fsPath).map(
        filename => new ElementJsonFileImpl(this, URI.file(path.resolve(elementFolderPath.fsPath, filename))),
      )
    }
    else {
      this._elementFolderExists = false
    }
    return this._elementFolderExists
  }

  private _mediaFolderExists: false | ResourceMediaFile[] | null = null

  async readMediaFolder(force?: boolean): Promise<false | ResourceMediaFile[]> {
    if (this._mediaFolderExists !== null && !force)
      return this._mediaFolderExists
    const mediaFolderPath = this.getElementFolderPath()
    if (fs.existsSync(mediaFolderPath.fsPath) && fs.statSync(mediaFolderPath.fsPath).isDirectory()) {
      this._mediaFolderExists = fs.readdirSync(mediaFolderPath.fsPath).map(
        filename => new ResourceMediaFileImpl(this, URI.file(path.resolve(mediaFolderPath.fsPath, filename))),
      )
    }
    else {
      this._mediaFolderExists = false
    }
    return this._mediaFolderExists
  }

  private _filePaths: ResourceRawFile[] | null = null

  async readRawFile(force?: boolean): Promise<ResourceRawFile[]> {
    if (this._filePaths !== null && !force)
      return this._filePaths
    const pattern = toPattern(path.resolve(this.resourceChildFolder.fsPath, '**', '*'))
    this._filePaths = fg.sync(pattern, {
      onlyFiles: true,
      onlyDirectories: false,
      absolute: true,
    }).map(filePath => new ResourceRawFileImpl(this, URI.file(filePath)))
    return this._filePaths
  }
}
