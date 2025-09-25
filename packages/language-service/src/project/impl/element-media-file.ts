import type { URI } from 'vscode-uri'
import type { ResourceFolder, ResourceMediaFile } from '../project'
import fs from 'node:fs'

export class ResourceMediaFileImpl implements ResourceMediaFile {
  constructor(
    private readonly resourceChildFolder: ResourceFolder,
    private readonly elementMediaFile: URI,
  ) {}

  getResourceFolder(): ResourceFolder {
    return this.resourceChildFolder
  }

  getUri(): URI {
    return this.elementMediaFile
  }

  private _isExist: boolean | null = null

  async isExist(force?: boolean): Promise<boolean> {
    if (this._isExist !== null && !force)
      return this._isExist
    this._isExist = fs.existsSync(this.elementMediaFile.fsPath) && fs.statSync(this.elementMediaFile.fsPath).isFile()
    this.getResourceFolder()
      .getModuleOpenHarmonyProject()
      .getProjectDetector()
      .getLogger('ProjectDetector/ResourceMediaFile/isExist')
      .getConsola()
      .info(`Check media file: ${this.elementMediaFile.toString()}`)
    return this._isExist
  }
}
