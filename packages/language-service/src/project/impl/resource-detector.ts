import type { ElementJsonFile, ModuleOpenHarmonyProject, ResourceChildFolder } from '../project'
import fs from 'node:fs'
import path from 'node:path'
import { URI } from 'vscode-uri'
import { ElementJsonFileImpl } from './element-json-file'

export class ResourceChildFolderImpl implements ResourceChildFolder {
  constructor(
    private readonly resourceChildFolder: URI,
    private readonly folderName: 'base' | 'dark' | 'rawfile' | 'resfile' | (string & {}),
    private readonly moduleOpenHarmonyProject: ModuleOpenHarmonyProject,
  ) {}

  getModuleOpenHarmonyProject(): ModuleOpenHarmonyProject {
    return this.moduleOpenHarmonyProject
  }

  getFolderName(): 'base' | 'dark' | 'rawfile' | 'resfile' | (string & {}) {
    return this.folderName
  }

  async isExist(): Promise<boolean> {
    return fs.existsSync(this.resourceChildFolder.fsPath) && fs.statSync(this.resourceChildFolder.fsPath).isDirectory()
  }

  async getElementFolderPath(): Promise<URI> {
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
    const elementFolderPath = await this.getElementFolderPath()
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
}
