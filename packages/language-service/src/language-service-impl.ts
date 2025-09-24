import type * as ets from 'ohos-typescript'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { $$ThisPosition, ArkTSExtraLanguageService, ArkTSExtraLanguageServiceOptions } from './language-service'
import { SymbolKind as LspSymbolKind, Range } from '@volar/language-server'
import { deepRemoveFalsyValue } from './utils/deep-remove-falsy-value'

export class ArkTSExtraLanguageServiceImpl implements ArkTSExtraLanguageService {
  constructor(private readonly options: ArkTSExtraLanguageServiceOptions) {}

  getLocale(): string {
    return this.options.locale
  }

  getETS(): typeof import('ohos-typescript') {
    return this.options.ets
  }

  get$$ThisPositions(sourceFile: ets.SourceFile, document: TextDocument): $$ThisPosition[] {
    const ranges: $$ThisPosition[] = []
    const ets = this.getETS()

    sourceFile.forEachChild(function visitor(node): void {
      node.forEachChild(visitor)

      if (!ets.isPropertyAccessExpression(node) || node.expression.getText(sourceFile) !== '$$this')
        return

      ranges.push({
        start: document.positionAt(node.expression.getStart(sourceFile)),
        end: document.positionAt(node.expression.getEnd()),
        ast: node,
      })
    })

    return ranges
  }

  private _builderProgram: ets.EmitAndSemanticDiagnosticsBuilderProgram | undefined

  getBuilderProgram(languageService: ets.LanguageService): ets.EmitAndSemanticDiagnosticsBuilderProgram {
    if (this._builderProgram)
      return this._builderProgram
    this._builderProgram = this.options.ets.createIncrementalProgramForArkTs({
      rootNames: languageService.getProgram()?.getRootFileNames() ?? [],
      options: languageService.getProgram()?.getCompilerOptions() ?? {},
    })
    return this._builderProgram
  }

  /**
   * 将`ets.ScriptElementKind`转换为LSP的`SymbolKind`。
   *
   * @see https://github.com/microsoft/vscode/blob/5b34b12d958fbb656b624629a242e78b3b667cf0/extensions/html-language-features/server/src/modes/javascriptMode.ts#L547
   */
  scriptElementKindToSymbolKind(kind: ets.ScriptElementKind, SymbolKind = LspSymbolKind): import('@volar/language-server').SymbolKind {
    const ets = this.getETS()

    switch (kind) {
      case ets.ScriptElementKind.moduleElement: return SymbolKind.Module
      case ets.ScriptElementKind.classElement: return SymbolKind.Class
      case ets.ScriptElementKind.enumElement: return SymbolKind.Enum
      case ets.ScriptElementKind.enumMemberElement: return SymbolKind.EnumMember
      case ets.ScriptElementKind.interfaceElement: return SymbolKind.Interface
      case ets.ScriptElementKind.indexSignatureElement: return SymbolKind.Method
      case ets.ScriptElementKind.callSignatureElement: return SymbolKind.Method
      case ets.ScriptElementKind.memberFunctionElement: return SymbolKind.Method
      case ets.ScriptElementKind.memberVariableElement: return SymbolKind.Property
      case ets.ScriptElementKind.memberGetAccessorElement: return SymbolKind.Property
      case ets.ScriptElementKind.memberSetAccessorElement: return SymbolKind.Property
      case ets.ScriptElementKind.variableElement: return SymbolKind.Variable
      case ets.ScriptElementKind.letElement: return SymbolKind.Variable
      case ets.ScriptElementKind.constElement: return SymbolKind.Variable
      case ets.ScriptElementKind.localVariableElement: return SymbolKind.Variable
      case ets.ScriptElementKind.alias: return SymbolKind.Variable
      case ets.ScriptElementKind.functionElement: return SymbolKind.Function
      case ets.ScriptElementKind.localFunctionElement: return SymbolKind.Function
      case ets.ScriptElementKind.constructSignatureElement: return SymbolKind.Constructor
      case ets.ScriptElementKind.constructorImplementationElement: return SymbolKind.Constructor
      case ets.ScriptElementKind.typeParameterElement: return SymbolKind.TypeParameter
      case ets.ScriptElementKind.string: return SymbolKind.String
      case ets.ScriptElementKind.structElement: return SymbolKind.Struct
      default: return SymbolKind.Variable
    }
  }

  getSymbolTree(item: ets.NavigationTree, document: TextDocument): import('@volar/language-server').DocumentSymbol | undefined {
    if (item.spans.length === 0) {
      return deepRemoveFalsyValue({
        name: (item.text || '').replace(/["'`]/g, ''),
        kind: this.scriptElementKindToSymbolKind(item.kind),
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
        selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
        detail: item.kindModifiers,
        children: (item.childItems || [])
          .map(item => this.getSymbolTree(item, document))
          .filter(child => child !== undefined),
      })
    }

    return deepRemoveFalsyValue({
      name: item.text.replace(/["'`]/g, ''),
      kind: this.scriptElementKindToSymbolKind(item.kind),
      range: Range.create(
        document.positionAt(item.spans[0].start),
        document.positionAt(item.spans[0].start + item.spans[0].length),
      ),
      selectionRange: Range.create(
        document.positionAt(item.spans[0].start),
        document.positionAt(item.spans[0].start + item.spans[0].length),
      ),
      detail: item.kindModifiers,
      children: (item.childItems || [])
        .map(item => this.getSymbolTree(item, document))
        .filter(child => child !== undefined),
    })
  }
}
