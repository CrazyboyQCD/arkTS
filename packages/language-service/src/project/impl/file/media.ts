import type { ImageTypeResult } from 'image-type'
import type { URI } from 'vscode-uri'
import type { ResourceMediaFile } from '../../proto/file/media'
import { Utils } from 'vscode-uri'
import { ResourceFolder } from '../../proto/folder/resource'

export class ResourceMediaFileImpl implements ResourceMediaFile {
  constructor(
    private readonly resourceChildFolder: ResourceFolder,
    private readonly elementMediaFile: URI,
  ) {}

  public kind: ResourceFolder.ResourceKind.Media = ResourceFolder.ResourceKind.Media

  getResourceFolder(): ResourceFolder {
    return this.resourceChildFolder
  }

  getUri(): URI {
    return this.elementMediaFile
  }

  getFileName(): string {
    return Utils.basename(this.elementMediaFile)
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

  getFileNameWithoutExtension(): string {
    return Utils.basename(this.elementMediaFile).replace(Utils.extname(this.elementMediaFile), '')
  }

  getReferencePath(): string {
    return `app.media.${this.getFileNameWithoutExtension()}`
  }

  private _isImage: false | ImageTypeResult | null = null

  async isImage(force: boolean = false): Promise<false | ImageTypeResult> {
    if (this._isImage !== null && !force)
      return this._isImage
    const imageType = await import('image-type')
    const fs = await this.getResourceFolder()
      .getOpenHarmonyModule()
      .getModuleOpenHarmonyProject()
      .getProjectDetector()
      .getFileSystem()
    try {
      const buffer = await fs.readFileAsBuffer(this.elementMediaFile.fsPath)
      const result = await imageType.default(new Uint8Array(buffer))
      this._isImage = result ?? false
    }
    catch (error) {
      this._isImage = false
      this.getResourceFolder()
        .getOpenHarmonyModule()
        .getModuleOpenHarmonyProject()
        .getProjectDetector()
        .getLogger('ProjectDetector/ResourceMediaFile/isImage')
        .getConsola()
        .error(`Error checking image file: ${this.elementMediaFile.toString()}`, error)
    }
    return this._isImage
  }
}
