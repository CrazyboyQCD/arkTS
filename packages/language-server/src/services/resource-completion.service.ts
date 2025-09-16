import type { ResourceIndexItem } from '@arkts/shared'
import type { LanguageServicePlugin } from '@volar/language-service'
import type * as ets from 'ohos-typescript'
import type { CompletionItem, CompletionList } from 'vscode-languageserver-protocol'
import type { Position, TextDocument } from 'vscode-languageserver-textdocument'
import type { LanguageServerConfigManager } from '../classes/config-manager'
import type { GlobalRCallInfo } from '../classes/global-call-expression-finder'
import { URI } from 'vscode-uri'
import { GlobalRCallFinder } from '../classes/global-call-expression-finder'
import { ResourceResolverManager } from '../classes/resource-resolver'
import { logger } from '../logger'
import { ContextUtil } from '../utils/finder'

/**
 * 资源补全上下文
 */
interface ResourceCompletionContext {
  /** 当前输入的文本 */
  currentInput: string
  /** 资源引用的起始位置 */
  startPosition: Position
  /** 是否在 $r() 调用内部 */
  isInResourceCall: boolean
  /** 已输入的部分（如 'app.color.' 或 'sys.'） */
  prefix: string
  /** 全局 $r 调用信息（如果可用） */
  globalRCallInfo?: GlobalRCallInfo
  /** 光标在资源字符串中的位置 */
  cursorPositionInResource?: number
}

/**
 * 资源补全上下文分析器
 */
class ResourceCompletionAnalyzer {
  constructor(private readonly ets: typeof import('ohos-typescript')) {}

  /**
   * 分析当前位置的资源补全上下文（使用 AST 分析）
   */
  analyzeContext(document: TextDocument, position: Position, sourceFile: ets.SourceFile): ResourceCompletionContext | null {
    try {
      // 验证输入参数
      if (!document || !position) {
        logger.getConsola().warn(`Invalid document or position provided to analyzeContext in ${document.uri}`)
        return null
      }
      // 使用 GlobalRCallFinder 查找所有 $r 调用
      const finder = new GlobalRCallFinder(this.ets)
      const globalRCalls = finder.findGlobalRCallsSimple(sourceFile)
      // 将位置转换为字符偏移量
      const offset = document.offsetAt(position)

      // 查找包含当前光标位置的 $r 调用
      const currentCall = globalRCalls.find(call => offset >= call.resourceStart && offset <= call.resourceEnd)
      if (!currentCall)
        return null

      // 计算光标在资源字符串中的相对位置
      const cursorPositionInResource = offset - currentCall.resourceStart
      const currentInput = currentCall.resourceValue.substring(0, cursorPositionInResource)

      return {
        currentInput,
        startPosition: document.positionAt(currentCall.resourceStart),
        isInResourceCall: true,
        prefix: currentInput,
        globalRCallInfo: currentCall,
        cursorPositionInResource,
      }
    }
    catch (error) {
      logger.getConsola().warn('Failed to analyze resource completion context with AST:', error)

      // 回退到正则表达式方法
      return this.analyzeContextFallback(document, position)
    }
  }

  /**
   * 回退的资源补全上下文分析（使用正则表达式）
   */
  private analyzeContextFallback(document: TextDocument, position: Position): ResourceCompletionContext | null {
    const line = document.getText({
      start: { line: position.line, character: 0 },
      end: { line: position.line, character: position.character },
    })

    // 查找 $r() 调用的正则表达式（修复转义问题）
    const resourceCallPattern = /\$r\s*\(\s*['"]?([^'")\s]*)$/
    const resourceCallMatch = line.match(resourceCallPattern)

    if (!resourceCallMatch) {
      return null
    }

    const currentInput = resourceCallMatch[1]
    const startCharacter = line.lastIndexOf('$r(') + 3

    return {
      currentInput,
      startPosition: { line: position.line, character: startCharacter },
      isInResourceCall: true,
      prefix: currentInput,
    }
  }
}

/**
 * 资源补全项生成器
 */
class ResourceCompletionGenerator {
  /**
   * 生成改进的资源补全项
   */
  generateItems(context: ResourceCompletionContext, resources: ResourceIndexItem[]): CompletionItem[] {
    try {
      // 验证输入参数
      if (!context || !resources) {
        logger.getConsola().warn('Invalid context or resources provided to generateItems')
        return []
      }

      const { prefix, globalRCallInfo } = context

      logger.getConsola().info('Generating items for prefix:', prefix, 'with global call info:', globalRCallInfo)

      // 如果前缀为空，提供范围选项
      if (!prefix) {
        return this.generateScopeOptions()
      }

      const parts = prefix.split('.')

      // 处理第一段：范围前缀匹配（如 'a', 's', 'app', 'sy'）
      if (parts.length === 1) {
        return this.generateScopeAndTypeOptions(parts[0], resources)
      }

      // 处理第二段：类型匹配（如 'app.c', 'sys.str'）
      if (parts.length === 2) {
        return this.generateTypeAndResourceOptions(parts[0], parts[1], resources)
      }

      // 处理第三段：资源名称匹配（如 'app.color.p', 'sys.string.ohos'）
      if (parts.length === 3) {
        return this.generateResourceNameOptions(parts[0], parts[1], parts[2], resources)
      }

      logger.getConsola().info(`Generated 0 completion items for prefix '${prefix}' (unsupported length: ${parts.length})`)
      return []
    }
    catch (error) {
      logger.getConsola().error('Error in generateItems:', error)
      return []
    }
  }

  /**
   * 生成范围选项（app, sys）
   */
  private generateScopeOptions(): CompletionItem[] {
    return [
      {
        label: 'app',
        kind: 14, // CompletionItemKind.Keyword
        detail: '应用资源',
        documentation: '引用应用本地资源',
        insertText: 'app.',
      },
      {
        label: 'sys',
        kind: 14, // CompletionItemKind.Keyword
        detail: '系统资源',
        documentation: '引用系统预定义资源',
        insertText: 'sys.',
      },
    ]
  }

  /**
   * 生成范围和类型选项
   */
  private generateScopeAndTypeOptions(scopePrefix: string, resources: ResourceIndexItem[]): CompletionItem[] {
    const items: CompletionItem[] = []
    const scopePrefixLower = scopePrefix.toLowerCase()

    // 前缀匹配范围
    if ('app'.startsWith(scopePrefixLower)) {
      items.push({
        label: 'app',
        kind: 14, // CompletionItemKind.Keyword
        detail: '应用资源',
        documentation: '引用应用本地资源',
        insertText: scopePrefixLower === 'app' ? '.' : 'app.',
        filterText: 'app',
      })
    }

    if ('sys'.startsWith(scopePrefixLower)) {
      items.push({
        label: 'sys',
        kind: 14, // CompletionItemKind.Keyword
        detail: '系统资源',
        documentation: '引用系统预定义资源',
        insertText: scopePrefixLower === 'sys' ? '.' : 'sys.',
        filterText: 'sys',
      })
    }

    // 如果是完整的scope（'app' 或 'sys'），还要提供类型选项
    const scope = scopePrefix as 'app' | 'sys'
    if (scope === 'app' || scope === 'sys') {
      const types = new Set<string>()
      resources
        .filter(r => r.reference.scope === scope)
        .forEach(r => types.add(r.reference.type))

      Array.from(types).forEach((type) => {
        items.push({
          label: type,
          kind: 7, // CompletionItemKind.Class
          detail: `${scope === 'app' ? '应用' : '系统'}${type}资源`,
          insertText: `${type}.`,
          filterText: type,
        })
      })
    }

    return items
  }

  /**
   * 生成类型和资源选项
   */
  private generateTypeAndResourceOptions(scope: string, typePrefix: string, resources: ResourceIndexItem[]): CompletionItem[] {
    const items: CompletionItem[] = []

    if (scope === 'app' || scope === 'sys') {
      const types = new Set<string>()
      resources
        .filter(r => r.reference.scope === scope)
        .forEach(r => types.add(r.reference.type))

      // 前缀匹配类型
      Array.from(types)
        .filter(type => type.toLowerCase().startsWith(typePrefix.toLowerCase()))
        .forEach((type) => {
          items.push({
            label: type,
            kind: 7, // CompletionItemKind.Class
            detail: `${scope === 'app' ? '应用' : '系统'}${type}资源`,
            insertText: typePrefix === type ? '.' : `${type.substring(typePrefix.length)}.`,
            filterText: type,
          })
        })

      // 如果是完整的类型，提供资源选项
      const filteredResources = resources.filter(
        r => r.reference.scope === scope && r.reference.type === typePrefix,
      )

      filteredResources.forEach((resource) => {
        items.push({
          label: resource.reference.name,
          kind: 12, // CompletionItemKind.Value
          detail: resource.location.value || `${scope}.${typePrefix} 资源`,
          documentation: `资源引用: ${resource.reference.raw}`,
          insertText: resource.reference.name,
          filterText: resource.reference.name,
        })
      })
    }

    return items
  }

  /**
   * 生成资源名称选项
   */
  private generateResourceNameOptions(scope: string, type: string, namePrefix: string, resources: ResourceIndexItem[]): CompletionItem[] {
    const items: CompletionItem[] = []

    const filteredResources = resources.filter(
      r => r.reference.scope === scope
        && r.reference.type === type
        && r.reference.name.toLowerCase().startsWith(namePrefix.toLowerCase()),
    )

    filteredResources.forEach((resource) => {
      items.push({
        label: resource.reference.name,
        kind: 12, // CompletionItemKind.Value
        detail: resource.location.value || `${scope}.${type} 资源`,
        documentation: `资源引用: ${resource.reference.raw}`,
        insertText: namePrefix === resource.reference.name ? '' : resource.reference.name.substring(namePrefix.length),
        filterText: resource.reference.name,
      })
    })

    return items
  }
}

/**
 * 生成资源补全项（向后兼容的导出函数）
 * @deprecated 建议使用 ResourceCompletionGenerator 类
 */
export function generateResourceCompletionItems(context: ResourceCompletionContext, resources: ResourceIndexItem[]): CompletionItem[] {
  const generator = new ResourceCompletionGenerator()
  return generator.generateItems(context, resources)
}

/**
 * 创建资源补全服务
 */
export function createResourceCompletionService(projectRoot: string, lspConfiguration: LanguageServerConfigManager): LanguageServicePlugin {
  logger.getConsola().info('Creating resource completion service with project root:', projectRoot)

  // 清理项目根路径（移除 file:// 前缀）
  const cleanProjectRoot = projectRoot.startsWith('file://')
    ? URI.parse(projectRoot).fsPath
    : projectRoot

  logger.getConsola().info('Cleaned project root:', cleanProjectRoot)
  // 设置项目根并尝试初始化资源解析器
  ResourceResolverManager.getInstance().setProjectRoot(cleanProjectRoot)
  ResourceResolverManager.getInstance().initialize(lspConfiguration)

  return {
    name: 'arkts-resource-completion',
    capabilities: {
      completionProvider: {
        triggerCharacters: ['.'],
        resolveProvider: false,
      },
    },
    create(context) {
      return {
        async provideCompletionItems(document: TextDocument, position: Position): Promise<CompletionList | null> {
          const sourceFile = new ContextUtil(context).decodeSourceFile(document)
          if (!sourceFile)
            return null

          try {
            logger.getConsola().info('[resource-completion] provideCompletionItems called for:', document.uri, 'at position:', position)
            // 导入 ohos-typescript
            const ets = await import('ohos-typescript')

            // 创建分析器和生成器
            const analyzer = new ResourceCompletionAnalyzer(ets)
            const generator = new ResourceCompletionGenerator()

            // 分析补全上下文（使用 AST 分析，简化版本）
            const completionContext = analyzer.analyzeContext(document, position, sourceFile)
            if (!completionContext) {
              logger.getConsola().info('[resource-completion] No resource completion context found')
              return null
            }

            logger.getConsola().info('Completion context:', completionContext)

            // 确保资源解析器已初始化且是最新的
            if (!ResourceResolverManager.getInstance().ensureInitialized(lspConfiguration)) {
              logger.getConsola().info('[resource-completion] Resource resolver not available')
              return null
            }

            // 获取所有资源
            const allResources = ResourceResolverManager.getInstance().getAllResources()

            // 生成补全项
            const completionItems = generator.generateItems(completionContext, allResources)

            logger.getConsola().info(`[resource-completion] Generated ${completionItems.length} completion items`)

            return {
              isIncomplete: false,
              items: completionItems,
            }
          }
          catch (error) {
            logger.getConsola().error('[resource-completion] Error in provideCompletionItems:', error)
            return null
          }
        },
      }
    },
  }
}
