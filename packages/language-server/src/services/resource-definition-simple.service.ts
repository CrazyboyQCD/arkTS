import type { LanguageServicePlugin, LocationLink } from '@volar/language-server'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { Position } from 'vscode-languageserver-protocol'
import { parseResourceReference, type ResourceLocation, type ResourceReference } from '@arkts/shared'

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
 * 创建资源定义跳转服务
 */
export function createResourceDefinitionService(): LanguageServicePlugin {
  return {
    name: 'arkts-resource-definition',
    capabilities: {
      definitionProvider: true,
    },
    create(context) {
      return {
        async provideDefinition(document: TextDocument, position: Position): Promise<LocationLink[] | null> {
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

          // TODO: 这里需要与资源解析器集成
          // 暂时返回 null，等待后续实现
          console.log('Found resource reference:', resourceRef)
          return null
        },
      }
    },
  }
}