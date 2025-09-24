import type { URI } from 'vscode-uri'
import type { ResourceChildFolder, ResourceMediaFile } from '../project'
import fs from 'node:fs'

export class ResourceMediaFileImpl implements ResourceMediaFile {
  constructor(
    private readonly resourceChildFolder: ResourceChildFolder,
    private readonly elementMediaFile: URI,
  ) {}

  getResourceChildFolder(): ResourceChildFolder {
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
    return this._isExist
  }
}
