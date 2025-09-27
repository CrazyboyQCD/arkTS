import type { Position } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { OpenHarmonyProjectDetector } from '../project'
import type { ElementJsonFile, OpenHarmonyModule } from '../project/project'
import type { ContextUtil } from './context-util'
import { URI } from 'vscode-uri'

export interface ResourceReferenceError {
  name: string
  kind: ElementJsonFile.ElementKind
  start: Position
  end: Position
}

export class ResourceUtil {
  constructor(
    private readonly contextUtil: ContextUtil,
    private readonly detector: OpenHarmonyProjectDetector,
    private readonly ets: typeof import('ohos-typescript'),
  ) {}

  async getResourceReference(document: TextDocument): Promise<OpenHarmonyModule.GroupByResourceReference[]> {
    const sourceFile = this.contextUtil.decodeSourceFile(document)
    if (!sourceFile)
      return []
    return await this.detector.getResourceReferenceByFilePath(URI.file(sourceFile.fileName), this.ets, this.detector.getForce())
  }

  async getResourceElementName(document: TextDocument, position: Position): Promise<ElementJsonFile.NameRange | null> {
    const tsSourceFile = this.contextUtil.decodeSourceFile(document)
    if (!tsSourceFile)
      return null
    const elementJsonFile = await this.detector.searchResourceElementFile(URI.file(tsSourceFile.fileName), this.detector.getForce())
    if (!elementJsonFile)
      return null
    const nameRanges = await elementJsonFile.getNameRange(this.ets, this.detector.getForce())
    return nameRanges.find(nameRange => nameRange.getStart().line === position.line && nameRange.getStart().character <= position.character && nameRange.getEnd().character >= position.character) ?? null
  }
}
