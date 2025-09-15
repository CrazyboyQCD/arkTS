import type { LanguageServicePlugin, LocationLink } from '@volar/language-server'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { Position } from 'vscode-languageserver-protocol'
import { parseResourceReference, ResourceResolver, type ResourceLocation } from '@arkts/shared'
import { URI } from 'vscode-uri'

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

// 全局资源解析器实例
let globalResourceResolver: ResourceResolver | null = null

/**
 * 初始化全局资源解析器
 */
export function initializeGlobalResourceResolver(projectRoot: string, sdkPath?: string): void {
  globalResourceResolver = new ResourceResolver(projectRoot, sdkPath)
  globalResourceResolver.buildIndex().catch(error => {
    console.error('Failed to build resource index:', error)
  })
}

/**
 * 在指定位置查找 $r() 调用
 */
function findResourceCallAtPosition(line: string, character: number): ResourceCallInfo | null {
  // 匹配 $r() 调用的正则表达式，支持各种引号和空格
  const resourceCallRegex = /\$r\s*\(\s*(['"`])([^'"\`]+)\1\s*\)/g
  
  let match: RegExpExecArray | null
  
  while ((match = resourceCallRegex.exec(line)) !== null) {
    const fullCall = match[0]
    const resourceRef = match[2] // 使用第二个捕获组，因为第一个是引号
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
 * 创建集成的资源定义跳转服务
 */
export function createIntegratedResourceDefinitionService(projectRoot: string, sdkPath?: string): LanguageServicePlugin {
  console.log('Creating integrated resource definition service with project root:', projectRoot)
  
  // 清理项目根路径（移除 file:// 前缀）
  const cleanProjectRoot = projectRoot.startsWith('file://') 
    ? URI.parse(projectRoot).fsPath 
    : projectRoot
  
  console.log('Cleaned project root:', cleanProjectRoot)
  
  // 初始化资源解析器
  initializeGlobalResourceResolver(cleanProjectRoot, sdkPath)
  
  return {
    name: 'arkts-resource-definition-integrated',
    capabilities: {
      definitionProvider: true,
    },
    create(context) {
      return {
        async provideDefinition(document: TextDocument, position: Position): Promise<LocationLink[] | null> {
          try {
            console.log('[ARKTS-RESOURCE] provideDefinition called for:', document.uri, 'at position:', position)
            
            // 只处理 .ets 文件
            if (!document.uri.endsWith('.ets')) {
              console.log('[ARKTS-RESOURCE] Not an .ets file, skipping')
              return null
            }
            
            // 获取当前位置的文本
            const line = document.getText({
              start: { line: position.line, character: 0 },
              end: { line: position.line + 1, character: 0 },
            })

            console.log('[ARKTS-RESOURCE] Current line:', line.trim())

            // 查找 $r() 调用
            const resourceCall = findResourceCallAtPosition(line, position.character)
            if (!resourceCall) {
              console.log('[ARKTS-RESOURCE] No $r() call found at position, letting other services handle')
              return null
            }

            console.log('[ARKTS-RESOURCE] Found $r() call:', resourceCall)

            // 解析资源引用
            const resourceRef = parseResourceReference(resourceCall.resourceRef)
            if (!resourceRef) {
              console.log('[ARKTS-RESOURCE] Failed to parse resource reference:', resourceCall.resourceRef)
              return null
            }

            console.log('[ARKTS-RESOURCE] Parsed resource reference:', resourceRef)

            // 检查全局资源解析器
            if (!globalResourceResolver) {
              console.log('[ARKTS-RESOURCE] Global resource resolver not available')
              return null
            }

            // 解析资源位置
            const resourceLocation = await globalResourceResolver.resolveResourceReference(resourceCall.resourceRef)
            if (!resourceLocation) {
              console.log('[ARKTS-RESOURCE] Resource not found:', resourceCall.resourceRef)
              return null
            }

            console.log('[ARKTS-RESOURCE] Found resource location:', resourceLocation)

            // 构建跳转位置
            const targetRange = resourceLocation.range || {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 0 },
            }

            const originSelectionRange = {
              start: { line: position.line, character: resourceCall.start },
              end: { line: position.line, character: resourceCall.end },
            }

            const result: LocationLink[] = [{
              targetUri: resourceLocation.uri,
              targetRange,
              targetSelectionRange: targetRange,
              originSelectionRange,
            }]

            console.log('[ARKTS-RESOURCE] Returning location link:', result)
            return result

          } catch (error) {
            console.error('[ARKTS-RESOURCE] Error in provideDefinition:', error)
            return null
          }
        },
      }
    },
  }
}