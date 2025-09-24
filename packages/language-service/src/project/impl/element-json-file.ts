import type { URI } from 'vscode-uri'
import type { ElementJsonFile, ResourceChildFolder } from '../project'
import fs from 'node:fs'

export class ElementJsonFileImpl implements ElementJsonFile {
  constructor(
    private readonly resourceChildFolder: ResourceChildFolder,
    private readonly elementJsonFile: URI,
  ) {}

  getResourceChildFolder(): ResourceChildFolder {
    return this.resourceChildFolder
  }

  getUri(): URI {
    return this.elementJsonFile
  }

  private _jsonText: string | null = null

  async readJsonText(force: boolean = false): Promise<string | null> {
    if (this._jsonText !== null && !force)
      return this._jsonText
    if (!fs.existsSync(this.elementJsonFile.fsPath) || !fs.statSync(this.elementJsonFile.fsPath).isFile())
      return null
    this._jsonText = fs.readFileSync(this.elementJsonFile.fsPath, 'utf-8')
    return this._jsonText
  }

  async readJsonSourceFile(ets: typeof import('ohos-typescript'), force: boolean = false): Promise<import('ohos-typescript').JsonSourceFile> {
    const jsonText = await this.readJsonText(force)
    if (jsonText === null)
      throw new Error('Json file not found')
    return ets.parseJsonText(this.getUri().fsPath, jsonText)
  }
}
