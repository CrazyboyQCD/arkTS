import type { URI } from 'vscode-uri'
import type { ResourceFolder, ResourceMediaFile } from '../../project'

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
    const fs = await this.getResourceFolder()
      .getOpenHarmonyModule()
      .getModuleOpenHarmonyProject()
      .getProjectDetector()
      .getFileSystem()
    this._isExist = await fs.exists(this.elementMediaFile.fsPath) && (await fs.stat(this.elementMediaFile.fsPath)).isFile()
    this.getResourceFolder()
      .getOpenHarmonyModule()
      .getModuleOpenHarmonyProject()
      .getProjectDetector()
      .getLogger('ProjectDetector/ResourceMediaFile/isExist')
      .getConsola()
      .info(`Check media file: ${this.elementMediaFile.toString()}`)
    return this._isExist
  }
}
