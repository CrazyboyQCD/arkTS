import type { URI } from 'vscode-uri'
import type { ResourceElementFile } from '../../../types/resource-element-file'
import type { DeepPartial } from '../../../types/util'
import type { ResourceFolder } from '../../project'
import fs from 'node:fs'
import { TextDocument } from '@volar/language-server'
import { ElementJsonFile } from '../../project'

export class ElementJsonFileImpl implements ElementJsonFile {
  constructor(
    private readonly resourceFolder: ResourceFolder,
    private readonly elementJsonFile: URI,
  ) {}

  getResourceFolder(): ResourceFolder {
    return this.resourceFolder
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

  private _jsonObject: DeepPartial<ResourceElementFile> | null = null

  async safeParse(force: boolean = false): Promise<DeepPartial<ResourceElementFile> | null> {
    if (this._jsonObject !== null && !force)
      return this._jsonObject
    const jsonText = await this.readJsonText(force)
    if (jsonText === null)
      return null
    this._jsonObject = JSON.parse(jsonText)
    return this._jsonObject
  }

  private _nameRanges: ElementJsonFile.NameRange[] | null = null

  async getNameRange(ets: typeof import('ohos-typescript'), force: boolean = false): Promise<ElementJsonFile.NameRange[]> {
    if (this._nameRanges !== null && !force)
      return this._nameRanges
    const ast = await this.readJsonSourceFile(ets, force)
    const textDocument = TextDocument.create(ast.fileName, 'json', 0, ast.getFullText(ast))
    const nameRanges: ElementJsonFile.NameRange[] = []

    for (const statement of ast.statements) {
      if (!ets.isObjectLiteralExpression(statement.expression))
        continue

      for (const property of statement.expression.properties) {
        if (!ets.isPropertyAssignment(property))
          continue

        if (!ets.isArrayLiteralExpression(property.initializer))
          continue

        const kind = property.name.getText(ast).replace(/["'`]/g, '') as ElementJsonFile.ElementKind
        if (!ElementJsonFile.ElementKind.is(kind))
          continue

        for (const element of property.initializer.elements) {
          if (!ets.isObjectLiteralExpression(element))
            continue

          const nameProperty = element.properties.find(p => p.name?.getText(ast).replace(/["'`]/g, '') === 'name')
          if (!nameProperty || !ets.isPropertyAssignment(nameProperty))
            continue

          nameRanges.push({
            kind,
            start: textDocument.positionAt(nameProperty.initializer.getStart(ast)),
            end: textDocument.positionAt(nameProperty.initializer.getEnd()),
            text: nameProperty.initializer.getText(ast).replace(/["'`]/g, ''),
            getElementJsonFile: () => this,
          })
        }
      }
    }

    this._nameRanges = nameRanges
    return this._nameRanges
  }

  async reset(): Promise<void> {
    this._jsonText = null
    this._jsonObject = null
    this._nameRanges = null
    this.getResourceFolder()
      .getOpenHarmonyModule()
      .getModuleOpenHarmonyProject()
      .getProjectDetector()
      .getLogger('ProjectDetector/ElementJsonFile/reset')
      .getConsola()
      .info(`Reset element json file: ${this.getUri().toString()}`)
  }
}
