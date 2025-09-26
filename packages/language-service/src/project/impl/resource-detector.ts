import type { ElementJsonFile, OpenHarmonyModule, ResourceFolder, ResourceMediaFile, ResourceRawFile } from '../project'
import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import { URI } from 'vscode-uri'
import { toPattern } from '../../utils/to-pattern'
import { ElementJsonFileImpl } from './element-json-file'
import { ResourceMediaFileImpl } from './element-media-file'
import { ResourceRawFileImpl } from './resource-raw-file'

export class ResourceChildFolderImpl implements ResourceFolder {
  constructor(
    private readonly resourceChildFolder: URI,
    private readonly openHarmonyModule: OpenHarmonyModule,
  ) {}

  getOpenHarmonyModule(): OpenHarmonyModule {
    return this.openHarmonyModule
  }

  async isExist(): Promise<boolean> {
    return fs.existsSync(this.resourceChildFolder.fsPath) && fs.statSync(this.resourceChildFolder.fsPath).isDirectory()
  }

  getUri(): URI {
    return this.resourceChildFolder
  }

  isBase(): boolean {
    return path.basename(this.resourceChildFolder.fsPath) === 'base'
  }

  isDark(): boolean {
    return path.basename(this.resourceChildFolder.fsPath) === 'dark'
  }

  isRawfile(): boolean {
    return path.basename(this.resourceChildFolder.fsPath) === 'rawfile'
  }

  isResfile(): boolean {
    return path.basename(this.resourceChildFolder.fsPath) === 'resfile'
  }

  isElementFolder(): boolean {
    // rawfile文件夹和resfile文件夹内部不可以有element文件夹（就算有也不处理）
    return !this.isRawfile() && !this.isResfile()
  }

  getElementFolderPath(): URI {
    return URI.file(path.resolve(this.resourceChildFolder.fsPath, 'element'))
  }

  getMediaFolderPath(): URI {
    return URI.file(path.resolve(this.resourceChildFolder.fsPath, 'media'))
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
      this.getOpenHarmonyModule()
        .getModuleOpenHarmonyProject()
        .getProjectDetector()
        .getLogger('ProjectDetector/ResourceFolder/readElementFolder')
        .getConsola()
        .info(`Read element folder: ${elementFolderPath.toString()}`)
    }
    else {
      this._elementFolderExists = false
      this.getOpenHarmonyModule()
        .getModuleOpenHarmonyProject()
        .getProjectDetector()
        .getLogger('ProjectDetector/ResourceFolder/readElementFolder')
        .getConsola()
        .warn(`Element folder not found: ${elementFolderPath.toString()}`)
    }
    return this._elementFolderExists
  }

  private _elementNameRangeReference: ElementJsonFile.NameRangeReference[] | null = null

  async getElementNameRangeReference(ets: typeof import('ohos-typescript'), force: boolean = false): Promise<ElementJsonFile.NameRangeReference[]> {
    if (this._elementNameRangeReference !== null && !force)
      return this._elementNameRangeReference
    const elementFolder = await this.readElementFolder(force)
    if (!elementFolder)
      return []

    const references: ElementJsonFile.NameRangeReference[] = []

    for (const element of elementFolder) {
      const nameRanges = await element.getNameRange(ets, force)

      for (const nameRange of nameRanges) {
        const foundIndex = references.findIndex(reference => reference.name === nameRange.text)
        if (foundIndex === -1) {
          references.push({
            name: nameRange.text,
            references: [nameRange],
          })
        }
        else {
          references[foundIndex].references.push(nameRange)
        }
      }
    }

    this._elementNameRangeReference = references
    return this._elementNameRangeReference
  }

  private _mediaFolderExists: false | ResourceMediaFile[] | null = null

  async readMediaFolder(force: boolean = false): Promise<false | ResourceMediaFile[]> {
    if (this._mediaFolderExists !== null && !force)
      return this._mediaFolderExists
    const mediaFolderPath = this.getMediaFolderPath()
    if (fs.existsSync(mediaFolderPath.fsPath) && fs.statSync(mediaFolderPath.fsPath).isDirectory()) {
      this.getOpenHarmonyModule()
        .getModuleOpenHarmonyProject()
        .getProjectDetector()
        .getLogger('ProjectDetector/ResourceFolder/readMediaFolder')
        .getConsola()
        .info(`Read media folder: ${mediaFolderPath.toString()}`)
      this._mediaFolderExists = fs.readdirSync(mediaFolderPath.fsPath).map(
        filename => new ResourceMediaFileImpl(this, URI.file(path.resolve(mediaFolderPath.fsPath, filename))),
      )
    }
    else {
      this._mediaFolderExists = false
      this.getOpenHarmonyModule()
        .getModuleOpenHarmonyProject()
        .getProjectDetector()
        .getLogger('ProjectDetector/ResourceFolder/readMediaFolder')
        .getConsola()
        .warn(`Media folder not found: ${mediaFolderPath.toString()}`)
    }
    return this._mediaFolderExists
  }

  private _filePaths: ResourceRawFile[] | null = null

  async readRawFile(force: boolean = false): Promise<ResourceRawFile[]> {
    if (this._filePaths !== null && !force)
      return this._filePaths
    const pattern = toPattern(path.resolve(this.resourceChildFolder.fsPath, '**', '*'))
    this._filePaths = fg.sync(pattern, {
      onlyFiles: true,
      onlyDirectories: false,
      absolute: true,
    }).map(filePath => new ResourceRawFileImpl(this, URI.file(filePath)))
    this.getOpenHarmonyModule()
      .getModuleOpenHarmonyProject()
      .getProjectDetector()
      .getLogger('ProjectDetector/ResourceFolder/readRawFile')
      .getConsola()
      .info(`Read raw file: ${pattern}`)
    return this._filePaths
  }

  async reset(): Promise<void> {
    this._elementFolderExists = null
    this._elementNameRangeReference = null
    this._mediaFolderExists = null
    this._filePaths = null
    this.getOpenHarmonyModule()
      .getModuleOpenHarmonyProject()
      .getProjectDetector()
      .getLogger('ProjectDetector/ResourceFolder/reset')
      .getConsola()
      .info(`Reset resource folder: ${this.resourceChildFolder.toString()}`)
  }
}
