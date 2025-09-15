import type { LanguageServicePlugin, LocationLink } from '@volar/language-server'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { Position } from 'vscode-languageserver-protocol'
import { parseResourceReference, type ResourceLocation, ResourceResolver } from '@arkts/shared'

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
}

/**
 * 在指定位置查找 $r() 调用
 */
function findResourceCallAtPosition(line: string, character: number): ResourceCallInfo | null {
  // 匹配 $r() 调用的正则表达式
  const resourceCallRegex = /\$r\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
  
  let match: RegExpExecArray | null
  
  while ((match = resourceCallRegex.exec(line)) !== null) {
    const fullCall = match[0]
    const resourceRef = match[1]
    const start = match.index
    const end = match.index + fullCall.length
    
    // 检查光标是否在这个 $r() 调用范围内
    if (character >= start && character <= end) {
      return {
        resourceRef,
        start,
        end,
        fullCall,
      }
    }
  }
  
  return null
}

/**
 * 资源定义服务
 */
class ResourceDefinitionService {
  private resolver?: ResourceResolver
  private initialized = false
  
  constructor(private projectRoot: string, private sdkPath?: string) {
    if (projectRoot) {
      this.resolver = new ResourceResolver(projectRoot, sdkPath)
    }
  }
  
  async initialize(): Promise<void> {
    if (!this.resolver || this.initialized) {
      return
    }
    
    try {
      await this.resolver.buildIndex()
      this.initialized = true
      console.log('Resource definition service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize resource definition service:', error)
    }
  }
  
  async resolveResourceReference(resourceRef: string): Promise<ResourceLocation | null> {
    if (!this.resolver) {
      return null
    }
    
    if (!this.initialized) {
      await this.initialize()
    }
    
    return this.resolver.resolveResourceReference(resourceRef)
  }
}

// 全局资源定义服务实例
let globalResourceService: ResourceDefinitionService | null = null

/**
 * 创建资源定义跳转服务
 */
export function createResourceDefinitionService(projectRoot?: string, sdkPath?: string): LanguageServicePlugin {
  return {
    name: 'arkts-resource-definition',
    capabilities: {
      definitionProvider: true,
    },
    create(context) {
      // 初始化全局服务实例（如果还没有的话）
      if (!globalResourceService && projectRoot) {
        globalResourceService = new ResourceDefinitionService(projectRoot, sdkPath)
        // 异步初始化
        globalResourceService.initialize()
      }
      
      return {
        async provideDefinition(document: TextDocument, position: Position): Promise<LocationLink[] | null> {
          try {
            // 获取当前位置的文本
            const line = document.getText({
              start: { line: position.line, character: 0 },
              end: { line: position.line + 1, character: 0 },
            })

            // 查找 $r() 调用
            const resourceCall = findResourceCallAtPosition(line, position.character)
            if (!resourceCall) {
              return null
            }

            // 解析资源引用
            const resourceRef = parseResourceReference(resourceCall.resourceRef)
            if (!resourceRef) {
              return null
            }

            console.log('Found resource reference:', resourceRef)
            
            // 解析资源位置
            const resourceLocation = globalResourceService 
              ? await globalResourceService.resolveResourceReference(resourceCall.resourceRef)
              : null
              
            if (!resourceLocation) {
              console.log('Resource not found:', resourceCall.resourceRef)
              return null
            }

            console.log('Resource resolved to:', resourceLocation)
            
            // 构建跳转位置
            const targetRange = resourceLocation.range || {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 0 },
            }

            const originSelectionRange = {
              start: { line: position.line, character: resourceCall.start },
              end: { line: position.line, character: resourceCall.end },
            }

            // 返回 LocationLink 格式，提供更好的跳转体验
            return [{
              targetUri: resourceLocation.uri,
              targetRange,
              targetSelectionRange: targetRange,
              originSelectionRange,
            }]
            
          } catch (error) {
            console.error('Error in provideDefinition:', error)
            return null
          }
        },
      }
    },
  }
}