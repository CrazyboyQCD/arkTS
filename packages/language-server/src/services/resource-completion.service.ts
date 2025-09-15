import type { TextDocument, Position } from 'vscode-languageserver-textdocument'
import type { CompletionItem, CompletionList } from 'vscode-languageserver-protocol'
import { ResourceResolver, type ResourceIndexItem } from '@arkts/shared'
import { URI } from 'vscode-uri'
import type { LanguageServicePlugin } from '@volar/language-service'

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
}

// 全局资源解析器实例
let globalResourceResolver: ResourceResolver | null = null
let globalProjectRoot: string = ''
let globalSdkPathGetter: (() => string) | null = null

/**
 * 初始化全局资源解析器
 */
function initializeGlobalResourceResolver(): void {
  if (!globalProjectRoot || !globalSdkPathGetter) {
    console.log('[ARKTS-COMPLETION] Cannot initialize: missing project root or SDK path getter')
    return
  }
  
  const currentSdkPath = globalSdkPathGetter()
  console.log('[ARKTS-COMPLETION] Initializing resource resolver with SDK path:', currentSdkPath)
  
  globalResourceResolver = new ResourceResolver(globalProjectRoot, currentSdkPath)
  globalResourceResolver.buildIndex().catch(error => {
    console.error('Failed to build resource index:', error)
  })
}

/**
 * 确保资源解析器已初始化且SDK路径是最新的
 */
function ensureResourceResolverInitialized(): boolean {
  if (!globalSdkPathGetter) {
    console.log('[ARKTS-COMPLETION] No SDK path getter available')
    return false
  }
  
  const currentSdkPath = globalSdkPathGetter()
  
  // 如果解析器不存在或SDK路径已更改，重新初始化
  if (!globalResourceResolver || currentSdkPath !== globalResourceResolver['sdkPath']) {
    console.log('[ARKTS-COMPLETION] Resource resolver needs (re)initialization')
    initializeGlobalResourceResolver()
  }
  
  return globalResourceResolver !== null
}

/**
 * 分析当前位置的资源补全上下文
 */
function analyzeResourceCompletionContext(
  document: TextDocument, 
  position: Position
): ResourceCompletionContext | null {
  const line = document.getText({
    start: { line: position.line, character: 0 },
    end: { line: position.line, character: position.character },
  })
  
  // 查找 $r() 调用的正则表达式（修复转义问题）
  const resourceCallPattern = /\$r\s*\(\s*['"]?([^'"\)]*)$/
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

/**
 * 生成改进的资源补全项
 */
function generateResourceCompletionItems(
  context: ResourceCompletionContext,
  resources: ResourceIndexItem[]
): CompletionItem[] {
  const items: CompletionItem[] = []
  const { prefix } = context
  
  console.log('[ARKTS-COMPLETION] Generating items for prefix:', prefix)
  
  // 如果前缀为空，提供范围选项
  if (!prefix) {
    items.push(
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
      }
    )
    return items
  }
  
  const parts = prefix.split('.')
  
  // 处理第一段：范围前缀匹配（如 'a', 's', 'app', 'sy'）
  if (parts.length === 1) {
    const scopePrefix = parts[0].toLowerCase()
    
    // 前缀匹配范围
    if ('app'.startsWith(scopePrefix)) {
      items.push({
        label: 'app',
        kind: 14, // CompletionItemKind.Keyword
        detail: '应用资源',
        documentation: '引用应用本地资源',
        insertText: scopePrefix === 'app' ? '.' : 'app.',
        filterText: 'app',
      })
    }
    
    if ('sys'.startsWith(scopePrefix)) {
      items.push({
        label: 'sys',
        kind: 14, // CompletionItemKind.Keyword
        detail: '系统资源', 
        documentation: '引用系统预定义资源',
        insertText: scopePrefix === 'sys' ? '.' : 'sys.',
        filterText: 'sys',
      })
    }
    
    // 如果是完整的scope（'app' 或 'sys'），还要提供类型选项
    const scope = parts[0] as 'app' | 'sys'
    if (scope === 'app' || scope === 'sys') {
      const types = new Set<string>()
      resources
        .filter(r => r.reference.scope === scope)
        .forEach(r => types.add(r.reference.type))
      
      Array.from(types).forEach(type => {
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
  
  // 处理第二段：类型匹配（如 'app.c', 'sys.str'）
  if (parts.length === 2) {
    const [scope, typePrefix] = parts
    
    if (scope === 'app' || scope === 'sys') {
      const types = new Set<string>()
      resources
        .filter(r => r.reference.scope === scope)
        .forEach(r => types.add(r.reference.type))
      
      // 前缀匹配类型
      Array.from(types)
        .filter(type => type.toLowerCase().startsWith(typePrefix.toLowerCase()))
        .forEach(type => {
          items.push({
            label: type,
            kind: 7, // CompletionItemKind.Class
            detail: `${scope === 'app' ? '应用' : '系统'}${type}资源`,
            insertText: typePrefix === type ? '.' : type.substring(typePrefix.length) + '.',
            filterText: type,
          })
        })
      
      // 如果是完整的类型，提供资源选项
      const filteredResources = resources.filter(
        r => r.reference.scope === scope && r.reference.type === typePrefix
      )
      
      filteredResources.forEach(resource => {
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
  
  // 处理第三段：资源名称匹配（如 'app.color.p', 'sys.string.ohos'）
  if (parts.length === 3) {
    const [scope, type, namePrefix] = parts
    
    const filteredResources = resources.filter(
      r => r.reference.scope === scope && 
           r.reference.type === type &&
           r.reference.name.toLowerCase().startsWith(namePrefix.toLowerCase())
    )
    
    filteredResources.forEach(resource => {
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
  
  console.log(`[ARKTS-COMPLETION] Generated ${items.length} completion items for prefix '${prefix}'`)
  return items
}

/**
 * 创建资源补全服务
 */
export function createResourceCompletionService(
  projectRoot: string,
  sdkPathGetter: () => string
): LanguageServicePlugin {
  console.log('Creating resource completion service with project root:', projectRoot)
  
  // 清理项目根路径（移除 file:// 前缀）
  const cleanProjectRoot = projectRoot.startsWith('file://') 
    ? URI.parse(projectRoot).fsPath 
    : projectRoot
  
  console.log('Cleaned project root:', cleanProjectRoot)
  
  // 设置全局变量
  globalProjectRoot = cleanProjectRoot
  globalSdkPathGetter = sdkPathGetter
  
  // 尝试初始化资源解析器
  initializeGlobalResourceResolver()
  
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
        async provideCompletionItems(
          document: TextDocument, 
          position: Position
        ): Promise<CompletionList | null> {
          try {
            console.log('[ARKTS-COMPLETION] provideCompletionItems called for:', document.uri, 'at position:', position)
            
            // 只处理 .ets 文件
            if (!document.uri.endsWith('.ets')) {
              console.log('[ARKTS-COMPLETION] Not an .ets file, skipping')
              return null
            }
            
            // 分析补全上下文
            const completionContext = analyzeResourceCompletionContext(document, position)
            if (!completionContext) {
              console.log('[ARKTS-COMPLETION] No resource completion context found')
              return null
            }
            
            console.log('[ARKTS-COMPLETION] Completion context:', completionContext)
            
            // 确保资源解析器已初始化且是最新的
            if (!ensureResourceResolverInitialized()) {
              console.log('[ARKTS-COMPLETION] Resource resolver not available')
              return null
            }
            
            // 获取所有资源
            const allResources = globalResourceResolver!.getAllResources()
            
            // 生成补全项
            const completionItems = generateResourceCompletionItems(completionContext, allResources)
            
            console.log(`[ARKTS-COMPLETION] Generated ${completionItems.length} completion items`)
            
            return {
              isIncomplete: false,
              items: completionItems
            }
            
          } catch (error) {
            console.error('[ARKTS-COMPLETION] Error in provideCompletionItems:', error)
            return null
          }
        },
      }
    },
  }
}