import type { LanguageServicePlugin, LocationLink } from '@volar/language-server'
import type * as ets from 'ohos-typescript'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { LanguageServerConfigManager } from '../classes/config-manager'
import { parseResourceReference } from '@arkts/shared'
import { Position, Range } from '@volar/language-server/node'
import { URI } from 'vscode-uri'
import { BaseResourceService } from '../classes/base-resource-service'
import { ResourceResolverManager } from '../classes/resource-resolver'
import { logger } from '../logger'
import { ContextUtil } from '../utils/finder'

/**
 * 资源定义服务
 */
export class ResourceDefinitionService extends BaseResourceService {
  constructor(private lspConfiguration: LanguageServerConfigManager) {
    super()
  }

  private readonly resourceResolverManager = ResourceResolverManager.getInstance()

  /**
   * 提供资源定义跳转
   */
  async provideDefinition(document: TextDocument, position: Position, sourceFile: ets.SourceFile): Promise<LocationLink[] | null> {
    try {
      this.info('provideDefinition', { uri: document.uri, position })

      // 查找当前位置的 $r() 调用
      const resourceCall = await this.findResourceCallAtPosition(document, position, sourceFile)
      if (!resourceCall) return null

      this.info('Found $r() call', resourceCall)

      // 解析资源引用
      const resourceRef = parseResourceReference(resourceCall.resourceValue)
      if (!resourceRef) {
        this.error('Failed to parse resource reference', resourceCall.resourceValue)
        return null
      }

      this.info('Parsed resource reference', resourceRef)

      // 确保资源解析器已初始化
      if (!this.resourceResolverManager.ensureInitialized(this.lspConfiguration)) {
        this.error('Resource resolver not available', null)
        return null
      }

      // 解析资源位置
      const resourceLocation = await this.resourceResolverManager.getResolver()!.resolveResourceReference(resourceCall.resourceValue)
      if (!resourceLocation) {
        this.info('Resource not found', resourceCall.resourceValue)
        return null
      }

      this.info('Found resource location', resourceLocation)

      // 构建跳转位置
      const targetRange = resourceLocation.range || {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      }

      const originSelectionRange = Range.create(
        Position.create(
          position.line,
          resourceCall.resourceStart - document.offsetAt({ line: position.line, character: 0 }),
        ),
        Position.create(
          position.line,
          resourceCall.resourceEnd - document.offsetAt({ line: position.line, character: 0 }),
        ),
      )

      const result: LocationLink[] = [{
        targetUri: resourceLocation.uri,
        targetRange,
        targetSelectionRange: targetRange,
        originSelectionRange,
      }]

      this.info('Returning location link', result)
      return result
    }
    catch (error) {
      this.error('Error in provideDefinition', error)
      return null
    }
  }
}

/**
 * 创建集成的资源定义跳转服务
 */
export function createETSIntegratedResourceDefinitionService(projectRoot: string, lspConfiguration: LanguageServerConfigManager): LanguageServicePlugin {
  logger.getConsola().info('Creating integrated resource definition service with project root:', projectRoot)

  // 清理项目根路径（移除 file:// 前缀）
  const cleanProjectRoot = projectRoot.startsWith('file://')
    ? URI.parse(projectRoot).fsPath
    : projectRoot

  logger.getConsola().info('Cleaned project root:', cleanProjectRoot)

  // 设置项目根并尝试初始化资源解析器
  ResourceResolverManager.getInstance().setProjectRoot(cleanProjectRoot)
  ResourceResolverManager.getInstance().initialize(lspConfiguration)

  // 创建服务实例
  const service = new ResourceDefinitionService(lspConfiguration)

  return {
    name: 'arkts-resource-definition-integrated',
    capabilities: {
      definitionProvider: true,
    },
    create(context) {
      return {
        async provideDefinition(document: TextDocument, position: Position): Promise<LocationLink[] | null> {
          const sourceFile = new ContextUtil(context).decodeSourceFile(document)
          if (!sourceFile) return null
          return service.provideDefinition(document, position, sourceFile)
        },
      }
    },
  }
}
