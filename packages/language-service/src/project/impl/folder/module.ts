import type { ModuleJson5 } from '../../../types/module-json5'
import type { DeepPartial } from '../../../types/util'
import type { ElementJsonFile, ModuleOpenHarmonyProject, OpenHarmonyModule, ResourceFolder } from '../../project'
import path from 'node:path'
import json5 from 'json5'
import { URI, Utils } from 'vscode-uri'
import { ResourceChildFolderImpl } from './resource'

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
    const projectDetector = this.getModuleOpenHarmonyProject().getProjectDetector()

    // check if the text document is updated, if so, return the text document
    const foundTextDocument = await projectDetector.findUpdatedTextDocument(this.getModuleJson5Path())
    if (foundTextDocument)
      return foundTextDocument.getText()

    // if the text document is not updated, return the cached text if not force
    if (this._moduleJson5 !== null && !force)
      return this._moduleJson5
    const moduleJson5Path = this.getModuleJson5Path().fsPath

    // If not found cached text, read the text from the file system
    const fs = await projectDetector.getFileSystem()

    try {
      if (!await fs.exists(moduleJson5Path) || !(await fs.stat(moduleJson5Path)).isFile())
        return null
      this.getModuleOpenHarmonyProject()
        .getProjectDetector()
        .getLogger('ProjectDetector/OpenHarmonyModule/readModuleJson5')
        .getConsola()
        .info(`Read module.json5: ${moduleJson5Path}`)
      this._moduleJson5 = await fs.readFile(moduleJson5Path, 'utf-8')
      return this._moduleJson5
    }
    catch (error) {
      console.error(`Read ${moduleJson5Path} failed, error:`, error)
      return null
    }
  }

  private _moduleJson5Parsed: DeepPartial<ModuleJson5> | null = null

  async safeParseModuleJson5(force: boolean = false): Promise<DeepPartial<ModuleJson5> | null> {
    // check if the text document is updated, if so, return the text document
    const projectDetector = this.getModuleOpenHarmonyProject().getProjectDetector()
    const foundTextDocument = await projectDetector.findUpdatedTextDocument(this.getModuleJson5Path())
    // try to parse the module.json5 from the text document, if success, return the parsed value; if failed, skip.
    if (foundTextDocument) {
      try {
        this._moduleJson5Parsed = json5.parse(foundTextDocument.getText())
        return this._moduleJson5Parsed
      }
      catch { /** skip, the text document is not valid. */ }
    }

    // if the module.json5 is already parsed, return the cached value if not force
    if (this._moduleJson5Parsed !== null && !force)
      return this._moduleJson5Parsed
    const moduleJson5 = await this.readModuleJson5Text(force)
    if (moduleJson5 === null)
      return null

    // If not found cached parsed value, parse the module.json5
    try {
      this._moduleJson5Parsed = json5.parse(moduleJson5)
      return this._moduleJson5Parsed
    }
    catch (error) {
      this.getModuleOpenHarmonyProject()
        .getProjectDetector()
        .getLogger('ProjectDetector/OpenHarmonyModule/safeParseModuleJson5')
        .getConsola()
        .error(`Parse module.json5 failed, error:`, error)
      return null
    }
  }

  private _moduleJson5SourceFile: import('ohos-typescript').JsonSourceFile | null = null

  async readModuleJson5SourceFile(ets: typeof import('ohos-typescript'), force: boolean = false): Promise<import('ohos-typescript').JsonSourceFile | null> {
    // check if the text document is updated, if so, return the text document
    const projectDetector = this.getModuleOpenHarmonyProject().getProjectDetector()
    const foundTextDocument = await projectDetector.findUpdatedTextDocument(this.getModuleJson5Path())
    if (foundTextDocument) {
      try {
        this._moduleJson5SourceFile = ets.parseJsonText(this.getModuleJson5Path().fsPath, foundTextDocument.getText())
        return this._moduleJson5SourceFile
      }
      catch { /** skip, the text document is not valid. */ }
    }

    // if the module.json5 source file is already read, return the cached value if not force
    if (this._moduleJson5SourceFile !== null && !force)
      return this._moduleJson5SourceFile
    const moduleJson5 = await this.readModuleJson5Text(force)
    // if the module.json5 is not found, return null
    if (moduleJson5 === null)
      return null
    this._moduleJson5SourceFile = ets.parseJsonText(this.getModuleJson5Path().fsPath, moduleJson5)
    return this._moduleJson5SourceFile
  }

  private resourceFolders: false | ResourceFolder[] | null = null

  private resourceFolderPath = Utils.joinPath(this.getModulePath(), 'resources')

  getResourceFolderPath(): URI {
    return this.resourceFolderPath
  }

  async readResourceFolder(force: boolean = false): Promise<ResourceFolder[] | false> {
    if (this.resourceFolders !== null && !force)
      return this.resourceFolders
    const resourceFolderPath = this.getResourceFolderPath()
    const fs = await this.getModuleOpenHarmonyProject()
      .getProjectDetector()
      .getFileSystem()

    if (!await fs.exists(resourceFolderPath.fsPath) || !(await fs.stat(resourceFolderPath.fsPath)).isDirectory())
      return false

    this.getModuleOpenHarmonyProject()
      .getProjectDetector()
      .getLogger('ProjectDetector/OpenHarmonyModule/readResourceFolder')
      .getConsola()
      .info(`Readed resource folder: ${resourceFolderPath.fsPath}`)

    const directoryFiles = await fs.readdir(resourceFolderPath.fsPath)

    if (!this.resourceFolders && directoryFiles.length > 0) {
      this.resourceFolders = []

      for (const filename of directoryFiles) {
        const filePath = path.resolve(resourceFolderPath.fsPath, filename)

        if (await fs.exists(filePath) && ((await fs.stat(filePath)).isDirectory())) {
          this.resourceFolders.push(new ResourceChildFolderImpl(URI.file(filePath), this))
        }
      }

      return this.resourceFolders
    }

    return false
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
      .then((references) => {
        const result: ElementJsonFile.NameRangeReference[] = []

        for (const reference of references) {
          const existingIndex = result.findIndex(item => item.name === reference.name)

          if (existingIndex === -1) {
            result.push(reference)
            continue
          }

          for (const newRef of reference.references) {
            const isDuplicate = result[existingIndex].references.some(existingRef =>
              existingRef.start.line === newRef.start.line
              && existingRef.start.character === newRef.start.character
              && existingRef.end.line === newRef.end.line
              && existingRef.end.character === newRef.end.character
              && existingRef.getElementJsonFile().getUri().toString() === newRef.getElementJsonFile().getUri().toString(),
            )
            if (!isDuplicate)
              result[existingIndex].references.push(newRef)
          }
        }

        return result
      })
  }

  async reset(): Promise<void> {
    this.resourceFolders = null
    this._moduleJson5 = null
    this._moduleJson5Parsed = null
    this._moduleJson5SourceFile = null
    this.getModuleOpenHarmonyProject()
      .getProjectDetector()
      .getLogger('ProjectDetector/OpenHarmonyModule/reset')
      .getConsola()
      .info(`Reset open harmony module: ${this.getModulePath().toString()}`)
  }
}
