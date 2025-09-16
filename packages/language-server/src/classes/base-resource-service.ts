import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { GlobalRCallInfo } from './global-call-expression-finder'
import { logger } from '../logger'
import { GlobalRCallFinder } from './global-call-expression-finder'

/**
 * 资源服务基类
 * 提供通用的 $r() 调用查找和分析功能
 */
export abstract class BaseResourceService {
  protected finder?: GlobalRCallFinder
  protected ets?: typeof import('ohos-typescript')

  constructor() {
    this.initializeEts()
  }

  /**
   * 初始化 ohos-typescript
   */
  private async initializeEts(): Promise<void> {
    if (!this.ets) {
      this.ets = await import('ohos-typescript')
      this.finder = new GlobalRCallFinder(this.ets)
    }
  }

  /**
   * 确保 ETS 和查找器已初始化
   */
  protected async ensureInitialized(): Promise<boolean> {
    if (!this.ets || !this.finder) {
      await this.initializeEts()
    }
    return !!(this.ets && this.finder)
  }

  /**
   * 查找文档中所有的 $r() 调用
   */
  protected async findAllResourceCalls(document: TextDocument): Promise<GlobalRCallInfo[]> {
    if (!(await this.ensureInitialized())) {
      logger.getConsola().warn('Failed to initialize ETS for resource call finding')
      return []
    }

    try {
      const sourceFile = this.ets!.createSourceFile(
        document.uri,
        document.getText(),
        this.ets!.ScriptTarget.ES2015,
        true,
      )

      return this.finder!.findGlobalRCallsSimple(sourceFile)
    }
    catch (error) {
      logger.getConsola().warn('Failed to find resource calls:', error)
      return []
    }
  }

  /**
   * 查找指定位置的 $r() 调用
   */
  protected async findResourceCallAtPosition(
    document: TextDocument,
    position: { line: number, character: number },
  ): Promise<GlobalRCallInfo | null> {
    const calls = await this.findAllResourceCalls(document)
    const offset = document.offsetAt(position)

    return calls.find(call =>
      offset >= call.resourceStart && offset <= call.resourceEnd,
    ) || null
  }

  /**
   * 检查文档是否为 .ets 文件
   */
  protected isEtsFile(document: TextDocument): boolean {
    return document.uri.endsWith('.ets')
  }

  /**
   * 记录服务操作日志
   */
  protected logOperation(operation: string, details?: any): void {
    logger.getConsola().info(`[${this.constructor.name}] ${operation}`, details)
  }

  /**
   * 记录错误日志
   */
  protected logError(operation: string, error: any): void {
    logger.getConsola().error(`[${this.constructor.name}] ${operation}:`, error)
  }
}
