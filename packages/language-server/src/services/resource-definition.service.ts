import type { LanguageServicePlugin, LocationLink } from '@volar/language-server'
import type { Position } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import { parseResourceReference, ResourceResolver } from '@arkts/shared'
import { URI } from 'vscode-uri'
import { logger } from '../logger'

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
let globalProjectRoot: string = ''
let globalSdkPathGetter: (() => string) | null = null

/**
 * 初始化全局资源解析器
 */
function initializeGlobalResourceResolver(): void {
  if (!globalProjectRoot || !globalSdkPathGetter) {
    logger.getConsola().info('Cannot initialize: missing project root or SDK path getter')
    return
  }

  const currentSdkPath = globalSdkPathGetter()
  logger.getConsola().info('Initializing resource resolver with SDK path:', currentSdkPath)

  globalResourceResolver = new ResourceResolver(logger, globalProjectRoot, currentSdkPath)
  globalResourceResolver.buildIndex().catch((error) => {
    logger.getConsola().error('Failed to build resource index:', error)
  })
}

/**
 * 确保资源解析器已初始化且SDK路径是最新的
 */
function ensureResourceResolverInitialized(): boolean {
  if (!globalSdkPathGetter) {
    logger.getConsola().info('No SDK path getter available')
    return false
  }

  const currentSdkPath = globalSdkPathGetter()

  // 如果解析器不存在或SDK路径已更改，重新初始化
  if (!globalResourceResolver || currentSdkPath !== globalResourceResolver.getSdkPath()) {
    logger.getConsola().info('Resource resolver needs (re)initialization')
    initializeGlobalResourceResolver()
  }

  return globalResourceResolver !== null
}

/**
 * 在指定位置查找 $r() 调用
 */
function findResourceCallAtPosition(line: string, character: number): ResourceCallInfo | null {
  // 匹配 $r() 调用的正则表达式，支持各种引号和空格
  const resourceCallRegex = /\$r\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g

  let match: RegExpExecArray | null

  // 循环匹配
  // eslint-disable-next-line no-cond-assign
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
export function createIntegratedResourceDefinitionService(
  projectRoot: string,
  sdkPathGetter: () => string,
): LanguageServicePlugin {
  logger.getConsola().info('Creating integrated resource definition service with project root:', projectRoot)

  // 清理项目根路径（移除 file:// 前缀）
  const cleanProjectRoot = projectRoot.startsWith('file://')
    ? URI.parse(projectRoot).fsPath
    : projectRoot

  logger.getConsola().info('Cleaned project root:', cleanProjectRoot)

  // 设置全局变量
  globalProjectRoot = cleanProjectRoot
  globalSdkPathGetter = sdkPathGetter

  // 尝试初始化资源解析器
  initializeGlobalResourceResolver()

  return {
    name: 'arkts-resource-definition-integrated',
    capabilities: {
      definitionProvider: true,
    },
    create() {
      return {
        async provideDefinition(document: TextDocument, position: Position): Promise<LocationLink[] | null> {
          try {
            logger.getConsola().info('provideDefinition called for:', document.uri, 'at position:', position)

            // 只处理 .ets 文件
            if (!document.uri.endsWith('.ets')) {
              logger.getConsola().info('Not an .ets file, skipping')
              return null
            }

            // 获取当前位置的文本
            const line = document.getText({
              start: { line: position.line, character: 0 },
              end: { line: position.line + 1, character: 0 },
            })

            logger.getConsola().info('Current line:', line.trim())

            // 查找 $r() 调用
            const resourceCall = findResourceCallAtPosition(line, position.character)
            if (!resourceCall) {
              logger.getConsola().info('No $r() call found at position, letting other services handle')
              return null
            }

            logger.getConsola().info('Found $r() call:', resourceCall)

            // 解析资源引用
            const resourceRef = parseResourceReference(resourceCall.resourceRef)
            if (!resourceRef) {
              logger.getConsola().info('Failed to parse resource reference:', resourceCall.resourceRef)
              return null
            }

            logger.getConsola().info('Parsed resource reference:', resourceRef)

            // 确保资源解析器已初始化且是最新的
            if (!ensureResourceResolverInitialized()) {
              logger.getConsola().info('Resource resolver not available')
              return null
            }

            // 解析资源位置
            const resourceLocation = await globalResourceResolver!.resolveResourceReference(resourceCall.resourceRef)
            if (!resourceLocation) {
              logger.getConsola().info('Resource not found:', resourceCall.resourceRef)
              return null
            }

            logger.getConsola().info('Found resource location:', resourceLocation)

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

            logger.getConsola().info('Returning location link:', result)
            return result
          }
          catch (error) {
            logger.getConsola().error('Error in provideDefinition:', error)
            return null
          }
        },
      }
    },
  }
}
