import type { LanguageServicePlugin, Range } from '@volar/language-server'
import type * as ets from 'ohos-typescript'
import type { Position, TextDocument } from 'vscode-languageserver-textdocument'
import type { OpenHarmonyProjectDetector } from './project'
import type { ElementJsonFile } from './project/project'
import { ArkTSExtraLanguageServiceImpl } from './language-service-impl'

export interface ArkTSExtraLanguageServiceOptions {
  /**
   * `ohos-typescript` 实例
   */
  ets: typeof import('ohos-typescript')
  /**
   * 当前语言，用于翻译文档。
   */
  locale: string
}

export interface $$ThisPosition extends Range {
  /**
   * 对应的AST节点，必为`PropertyAccessExpression`。
   *
   * @description 具体建议用ast-explorer查询。
   * @see https://ast-explorer.dev
   */
  ast: ets.PropertyAccessExpression
}

export interface $rCallExpression extends Range {
  /**
   * 对应的AST节点，必为`CallExpression`。
   */
  ast: ets.CallExpression
  /**
   * $r('foo.bar.baz') 的文本。
   */
  text: string
  /** The start position of the string. */
  stringStart: Position
  /** The end position of the string. */
  stringEnd: Position
}

export interface ModuleJson5ResourceReference extends Range {
  /**
   * The name of the resource.
   */
  name: string
  /**
   * The kind of the resource.
   */
  kind: ElementJsonFile.ElementKind
  /**
   * The full text of the resource reference.
   */
  fullText: string
}

export interface ArkTSExtraLanguageService {
  /**
   * 获取 $$this 的位置
   *
   * @param sourceFile 源文件
   * @param document 文档
   * @returns 位置
   */
  get$$ThisPositions(sourceFile: ets.SourceFile, document: TextDocument): $$ThisPosition[]
  /**
   * 获取 $r 的位置
   *
   * @param sourceFile 源文件
   * @param document 文档
   * @returns 位置
   */
  get$rCallExpressions(sourceFile: ets.SourceFile, document: TextDocument): $rCallExpression[]
  /**
   * 获取 module.json5 资源引用
   *
   * @param sourceFile 源文件
   * @param document 文档
   * @returns 资源引用
   */
  getModuleJson5ResourceReferences(sourceFile: ets.SourceFile, document: TextDocument): ModuleJson5ResourceReference[]
  /** 获取当前语言代码。 */
  getLocale(): string
  /**
   * 获取文档符号。
   *
   * @param tree 文档符号
   * @param document 文档
   *
   * @example
   * A pseudo code example:
   *
   * ```ts
   * import { createArkTSExtraLanguageService } from '@arkts/language-service'
   * const arktsExtraLanguageService = createArkTSExtraLanguageService({ ets, locale: 'zh-CN' })
   * // getLanguageService() is created by `ohos-typescript`
   * // For example: ets.createLanguageService(...options)
   * const tree = getLanguageService().getNavigationTree(document.uri)
   * const symbolTree = arktsExtraLanguageService.getSymbolTree(tree, document)
   * ```
   */
  getSymbolTree(tree: ets.NavigationTree, document: TextDocument): import('@volar/language-server').DocumentSymbol | undefined
}

/**
 * 创建附加的ArkTS语言服务。该服务提供一系列ArkTS特有的语言服务功能，由本`@arkts/language-service`提供。
 *
 * @param options 选项
 */
export function createArkTSExtraLanguageService(options: ArkTSExtraLanguageServiceOptions): ArkTSExtraLanguageService {
  return new ArkTSExtraLanguageServiceImpl(options)
}

export interface ArkTServices extends Array<LanguageServicePlugin> {
  /**
   * 获取ArkTS高级语言服务。
   */
  getArkTSExtraLanguageService(): ArkTSExtraLanguageService
}

/**
 * 创建完整的、仅限于ArkTS语言服务的集合。
 *
 * @returns 语言服务集合，并且提供一个`getArkTSExtraLanguageService`方法，用于获取ArkTS高级语言服务。
 */
export async function createArkTServices(options: ArkTSExtraLanguageServiceOptions, detector: OpenHarmonyProjectDetector): Promise<ArkTServices> {
  const arktsExtraLanguageService = createArkTSExtraLanguageService(options)

  const importedServices = await import('./services')
  const services = await Promise.all(
    Object.values(importedServices).map(
      service => service(arktsExtraLanguageService, detector),
    ),
  ) as ArkTServices

  services.getArkTSExtraLanguageService = () => arktsExtraLanguageService
  return services
}
