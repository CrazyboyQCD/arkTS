import type { LanguageServiceContext } from '@volar/language-server'
import type * as ets from 'ohos-typescript'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'

export interface TSProvider {
  'typescript/languageService'(): ets.LanguageService
}

/** 一些工具类，用于services中获取一些对象。 */
export class ContextUtil {
  constructor(private readonly context: LanguageServiceContext) {}

  /**
   * 获取已有的`LanguageService`对象
   *
   * @description ⚠️ 注意，此方法只能在provide层使用，在create(context)层中使用是拿不到LanguageService对象的！！
   * @returns LanguageService对象，如果获取失败则返回null
   */
  getLanguageService(): ets.LanguageService | null {
    const languageService = this.context.inject<TSProvider>(`typescript/languageService`)
    if (!languageService) return null
    return languageService
  }

  decodeTextDocumentUri(document: TextDocument): URI | null {
    const decoded = this.context.decodeEmbeddedDocumentUri(URI.parse(document.uri))
    if (!decoded) return null
    const [decodedUri] = decoded
    return decodedUri
  }

  /**
   * 解码`TextDocument`并获取`TS源文件AST`
   *
   * @param document 当前TextDocument对象
   * @returns 源文件AST，如果获取失败则返回null
   */
  decodeSourceFile(document: TextDocument): ets.SourceFile | null {
    const decoded = this.context.decodeEmbeddedDocumentUri(URI.parse(document.uri))
    if (!decoded) return null
    const [decodedUri] = decoded
    const languageService = this.context.inject<TSProvider>(`typescript/languageService`)
    if (!languageService) return null
    const program = languageService.getProgram()
    if (!program) return null
    const sourceFile = program.getSourceFile(decodedUri.fsPath)
    if (!sourceFile) return null
    return sourceFile
  }

  /**
   * 解码`TextDocument`并获取`TS源文件AST`。
   *
   * 该方法获取到的是开始解析时的原始TS源文件AST (Powered by `ts-macro`)
   *
   * @param document 当前 `TextDocument` 对象
   * @param ets 如果不传则不完整校验获取到的到底是否是一个正确的 {@linkcode ets.SourceFile} 对象
   * @returns 如果获取失败则返回 `null`
   */
  getOriginalSourceFile(document: TextDocument, ets?: typeof import('ohos-typescript')): ets.SourceFile | null {
    const decoded = this.context.decodeEmbeddedDocumentUri(URI.parse(document.uri))
    if (!decoded) return null
    const [decodedUri, embeddedCodeId] = decoded
    const virtualCode = this.context.language.scripts.get(decodedUri)?.generated?.embeddedCodes.get(embeddedCodeId)
    if (!virtualCode || !('ast' in virtualCode) || typeof virtualCode.ast !== 'object' || virtualCode.ast === null) return null
    if (ets && !ets.isSourceFile(virtualCode.ast as ets.Node)) return null
    return virtualCode.ast as ets.SourceFile
  }
}
