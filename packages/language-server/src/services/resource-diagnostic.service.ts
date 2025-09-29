import type { Diagnostic, LanguageServicePlugin } from '@volar/language-server'
import type * as ets from 'ohos-typescript'
import type { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { LanguageServerConfigManager } from '../classes/config-manager'
import { parseResourceReference, ResourceResolver } from '@arkts/shared'
import { BaseResourceService } from '../classes/base-resource-service'
import { logger } from '../logger'
import { ContextUtil } from '../utils/finder'

/**
 * 资源引用诊断级别
 */
export type ResourceDiagnosticLevel = 'error' | 'warning' | 'none'

/**
 * 将诊断级别转换为LSP诊断严重性
 */
function getDiagnosticSeverity(level: ResourceDiagnosticLevel): DiagnosticSeverity {
  switch (level) {
    case 'error':
      return 1 // DiagnosticSeverity.Error
    case 'warning':
      return 2 // DiagnosticSeverity.Warning
    default:
      return 1 // 默认为错误
  }
}

/**
 * 资源诊断服务
 */
class ResourceDiagnosticService extends BaseResourceService {
  private resolver?: ResourceResolver
  private initialized = false
  private currentSdkPath?: string

  constructor(
    private projectRoot: string,
    private lspConfiguration: LanguageServerConfigManager,
  ) {
    super()
  }

  async initialize(): Promise<void> {
    if (this.initialized && this.resolver) {
      // 检查SDK路径是否已更改
      const currentSdkPath = this.lspConfiguration.getSdkPath()
      if (currentSdkPath === this.currentSdkPath) {
        return // 没有变化，无需重新初始化
      }
    }

    // 获取当前SDK路径
    const sdkPath = this.lspConfiguration.getSdkPath()
    this.info('Initializing with SDK path', sdkPath)

    if (this.projectRoot) {
      this.resolver = new ResourceResolver(logger, this.projectRoot, sdkPath)
      this.currentSdkPath = sdkPath
    }

    if (!this.resolver) {
      return
    }

    try {
      await this.resolver.buildIndex()
      this.initialized = true
      this.info('Resource diagnostic service initialized successfully')
    }
    catch (error) {
      this.error('Failed to initialize resource diagnostic service', error)
    }
  }

  async provideDiagnostics(
    document: TextDocument,
    diagnosticLevel: ResourceDiagnosticLevel,
    sourceFile: ets.SourceFile,
  ): Promise<Diagnostic[]> {
    // 如果设置为none，不提供任何诊断
    if (diagnosticLevel === 'none') {
      return []
    }

    if (!this.resolver) {
      return []
    }

    if (!this.initialized) {
      await this.initialize()
    }

    const diagnostics: Diagnostic[] = []
    const resourceCalls = await this.findAllResourceCalls(sourceFile)

    for (const call of resourceCalls) {
      // 解析资源引用
      const resourceRef = parseResourceReference(call.resourceValue)
      if (!resourceRef) {
        // 无法解析的资源引用
        diagnostics.push({
          range: {
            start: { line: call.line, character: call.resourceStart - document.offsetAt({ line: call.line, character: 0 }) },
            end: { line: call.line, character: call.resourceEnd - document.offsetAt({ line: call.line, character: 0 }) },
          },
          message: `无效的资源引用格式: ${call.resourceValue}`,
          severity: getDiagnosticSeverity(diagnosticLevel),
          code: 'ARKTS_INVALID_RESOURCE_REFERENCE',
          source: 'arkts-resource',
        })
        continue
      }

      // 检查资源是否存在
      const resourceLocation = await this.resolver.resolveResourceReference(call.resourceValue)
      if (!resourceLocation) {
        diagnostics.push({
          range: {
            start: { line: call.line, character: call.resourceStart - document.offsetAt({ line: call.line, character: 0 }) },
            end: { line: call.line, character: call.resourceEnd - document.offsetAt({ line: call.line, character: 0 }) },
          },
          message: `找不到资源: ${call.resourceValue}`,
          severity: getDiagnosticSeverity(diagnosticLevel),
          code: 'ARKTS_RESOURCE_NOT_FOUND',
          source: 'arkts-resource',
        })
      }
    }

    return diagnostics
  }
}

// 全局资源诊断服务实例
let globalResourceDiagnosticService: ResourceDiagnosticService | null = null

/**
 * 创建资源诊断服务
 */
export function createETSResourceDiagnosticService(lspConfiguration: LanguageServerConfigManager, projectRoot?: string, getDiagnosticLevel?: () => ResourceDiagnosticLevel): LanguageServicePlugin {
  return {
    name: 'arkts-resource-diagnostic',
    capabilities: {
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false,
      },
    },
    create(context) {
      // 初始化全局服务实例（如果还没有的话）
      if (!globalResourceDiagnosticService && projectRoot) {
        globalResourceDiagnosticService = new ResourceDiagnosticService(projectRoot, lspConfiguration)
        // 异步初始化
        globalResourceDiagnosticService.initialize()
      }

      return {
        async provideDiagnostics(document: TextDocument): Promise<Diagnostic[]> {
          const sourceFile = new ContextUtil(context).decodeSourceFile(document)
          if (!sourceFile) return []

          try {
            // 获取诊断级别
            const diagnosticLevel = getDiagnosticLevel?.() || 'error'
            logger.getConsola().info(`Current diagnostic level for resource: ${diagnosticLevel}`)

            if (!globalResourceDiagnosticService) {
              return []
            }

            return await globalResourceDiagnosticService.provideDiagnostics(document, diagnosticLevel, sourceFile)
          }
          catch (error) {
            logger.getConsola().error('Error in resource diagnostics:', error)
            return []
          }
        },
      }
    },
  }
}
