import type { ResourceIndexItem, ResourceLocation } from '@arkts/shared'
import type { Connection, DidChangeConfigurationParams, DidChangeWatchedFilesParams, LanguageServicePlugin } from '@volar/language-server'
import { ResourceResolver } from '@arkts/shared'
import { URI } from 'vscode-uri'
import { logger } from '../logger'

/**
 * 资源检测服务配置
 */
export interface ResourceDetectorConfig {
  /** 项目根路径 */
  projectRoot: string
  /** 是否启用自动检测 */
  enabled: boolean
  /** 监控的文件模式 */
  watchPatterns: string[]
}

/**
 * 资源检测服务
 */
export class ResourceDetectorService {
  private resolver: ResourceResolver
  private config: ResourceDetectorConfig
  private isIndexBuilt = false
  private connection?: Connection

  constructor(config: ResourceDetectorConfig) {
    this.config = config
    this.resolver = new ResourceResolver(logger, config.projectRoot)
  }

  /**
   * 设置 LSP 连接
   */
  setConnection(connection: Connection): void {
    this.connection = connection
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    await this.buildResourceIndex()
    this.setupFileWatcher()
  }

  /**
   * 构建资源索引
   */
  async buildResourceIndex(): Promise<void> {
    try {
      await this.resolver.buildIndex()
      this.isIndexBuilt = true

      if (this.connection) {
        this.connection.console.info('Resource index built successfully')
      }
    }
    catch (error) {
      if (this.connection) {
        this.connection.console.error(`Failed to build resource index: ${error}`)
      }
    }
  }

  /**
   * 设置文件监控
   */
  private setupFileWatcher(): void {
    if (!this.connection) {
      return
    }

    // 监控资源文件变化
    this.connection.onDidChangeWatchedFiles(async (params: DidChangeWatchedFilesParams) => {
      let needsRebuild = false

      for (const change of params.changes) {
        const uri = URI.parse(change.uri)
        const filePath = uri.fsPath

        // 检查是否是资源文件
        if (this.isResourceFile(filePath)) {
          needsRebuild = true
          break
        }
      }

      if (needsRebuild) {
        await this.buildResourceIndex()
      }
    })
  }

  /**
   * 检查文件是否是资源文件
   */
  private isResourceFile(filePath: string): boolean {
    const resourcesPattern = /src[\\/]main[\\/]resources[\\/]base/
    const elementPattern = /element[\\/]\w+\.json$/
    const mediaPattern = /media[\\/]/

    return resourcesPattern.test(filePath) && (elementPattern.test(filePath) || mediaPattern.test(filePath))
  }

  /**
   * 解析资源引用
   */
  async resolveResourceReference(resourceRef: string): Promise<ResourceLocation | null> {
    if (!this.isIndexBuilt) {
      await this.buildResourceIndex()
    }

    return this.resolver.resolveResourceReference(resourceRef)
  }

  /**
   * 获取所有资源
   */
  getAllResources(): ResourceIndexItem[] {
    return this.resolver.getAllResources()
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ResourceDetectorConfig>): void {
    this.config = { ...this.config, ...newConfig }

    if (newConfig.projectRoot && newConfig.projectRoot !== this.resolver.getProjectRoot()) {
      this.resolver = new ResourceResolver(logger, newConfig.projectRoot)
      this.isIndexBuilt = false

      if (this.config.enabled) {
        this.buildResourceIndex()
      }
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.resolver.clearIndex()
    this.isIndexBuilt = false
  }
}

/**
 * 创建资源检测插件
 */
export function createResourceDetectorPlugin(config: ResourceDetectorConfig): LanguageServicePlugin {
  const service = new ResourceDetectorService(config)

  return {
    name: 'arkts-resource-detector',
    capabilities: {
      // 不需要特殊能力，主要是后台服务
    },
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    create(context) {
      // 设置连接
      if ('connection' in context && context.connection) {
        service.setConnection(context.connection as Connection)
      }

      // 初始化服务
      service.initialize().catch((error) => {
        console.error('Failed to initialize resource detector:', error)
      })

      return {
        // 监听配置变化
        onDidChangeConfiguration(params: DidChangeConfigurationParams) {
          const settings = params.settings
          if (settings && settings.arkts && settings.arkts.resources) {
            service.updateConfig(settings.arkts.resources)
          }
        },

        // 提供资源解析功能给其他服务使用
        resolveResource: (resourceRef: string) => service.resolveResourceReference(resourceRef),
        getAllResources: () => service.getAllResources(),
      }
    },

    // 插件销毁时清理资源
    dispose() {
      service.dispose()
    },
  }
}

/**
 * 默认配置
 */
export const defaultResourceDetectorConfig: ResourceDetectorConfig = {
  projectRoot: '',
  enabled: true,
  watchPatterns: [
    '**/src/main/resources/base/element/*.json',
    '**/src/main/resources/base/media/*',
  ],
}
