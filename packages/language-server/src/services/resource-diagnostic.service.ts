import type { Diagnostic, LanguageServicePlugin } from '@volar/language-server'
import type { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import { parseResourceReference, ResourceResolver } from '@arkts/shared'
import { logger } from '../logger'

/**
 * 资源引用诊断级别
 */
export type ResourceDiagnosticLevel = 'error' | 'warning' | 'none'

/**
 * 资源调用信息
 */
interface ResourceCallInfo {
  /** 资源引用字符串 */
  resourceRef: string
  /** 在行中的开始位置 */
  start: number
  /** 在行中的结束位置 */
  end: number
  /** 完整的 $r() 调用 */
  fullCall: string
  /** 行号 */
  line: number
}

/**
 * 查找文档中所有的 $r() 调用
 */
function findAllResourceCalls(document: TextDocument): ResourceCallInfo[] {
  const text = document.getText()
  const lines = text.split('\n')
  const resourceCalls: ResourceCallInfo[] = []

  // 匹配 $r() 调用的正则表达式
  const resourceCallRegex = /\$r\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    let match: RegExpExecArray | null

    // 重置正则表达式的lastIndex
    resourceCallRegex.lastIndex = 0

    // eslint-disable-next-line no-cond-assign
    while ((match = resourceCallRegex.exec(line)) !== null) {
      const fullCall = match[0]
      const resourceRef = match[1]
      const start = match.index
      const end = match.index + fullCall.length

      resourceCalls.push({
        resourceRef,
        start,
        end,
        fullCall,
        line: lineIndex,
      })
    }
  }

  return resourceCalls
}

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
class ResourceDiagnosticService {
  private resolver?: ResourceResolver
  private initialized = false
  private currentSdkPath?: string

  constructor(
    private projectRoot: string,
    private sdkPathGetter?: () => string,
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized && this.resolver) {
      // 检查SDK路径是否已更改
      const currentSdkPath = this.sdkPathGetter?.()
      if (currentSdkPath === this.currentSdkPath) {
        return // 没有变化，无需重新初始化
      }
    }

    // 获取当前SDK路径
    const sdkPath = this.sdkPathGetter?.()
    logger.getConsola().info('Initializing with SDK path:', sdkPath)

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
      logger.getConsola().info('Resource diagnostic service initialized successfully')
    }
    catch (error) {
      logger.getConsola().error('Failed to initialize resource diagnostic service:', error)
    }
  }

  async provideDiagnostics(
    document: TextDocument,
    diagnosticLevel: ResourceDiagnosticLevel,
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
    const resourceCalls = findAllResourceCalls(document)

    for (const call of resourceCalls) {
      // 解析资源引用
      const resourceRef = parseResourceReference(call.resourceRef)
      if (!resourceRef) {
        // 无法解析的资源引用
        diagnostics.push({
          range: {
            start: { line: call.line, character: call.start },
            end: { line: call.line, character: call.end },
          },
          message: `无效的资源引用格式: ${call.resourceRef}`,
          severity: getDiagnosticSeverity(diagnosticLevel),
          code: 'ARKTS_INVALID_RESOURCE_REFERENCE',
          source: 'arkts-resource',
        })
        continue
      }

      // 检查资源是否存在
      const resourceLocation = await this.resolver.resolveResourceReference(call.resourceRef)
      if (!resourceLocation) {
        diagnostics.push({
          range: {
            start: { line: call.line, character: call.start },
            end: { line: call.line, character: call.end },
          },
          message: `找不到资源: ${call.resourceRef}`,
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
export function createResourceDiagnosticService(
  projectRoot?: string,
  getDiagnosticLevel?: () => ResourceDiagnosticLevel,
  sdkPathGetter?: () => string,
): LanguageServicePlugin {
  return {
    name: 'arkts-resource-diagnostic',
    capabilities: {
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false,
      },
    },
    create() {
      // 初始化全局服务实例（如果还没有的话）
      if (!globalResourceDiagnosticService && projectRoot) {
        globalResourceDiagnosticService = new ResourceDiagnosticService(projectRoot, sdkPathGetter)
        // 异步初始化
        globalResourceDiagnosticService.initialize()
      }

      return {
        async provideDiagnostics(document: TextDocument): Promise<Diagnostic[]> {
          try {
            // 检查是否是.ets文件
            if (!document.uri.endsWith('.ets')) {
              return []
            }

            // 获取诊断级别
            const diagnosticLevel = getDiagnosticLevel?.() || 'error'

            if (!globalResourceDiagnosticService) {
              return []
            }

            return await globalResourceDiagnosticService.provideDiagnostics(document, diagnosticLevel)
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
