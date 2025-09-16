import type { ResourceIndexItem } from '@arkts/shared'
import type { LanguageServerConfigManager } from './config-manager'
import { ResourceResolver } from '@arkts/shared'
import { URI } from 'vscode-uri'
import { logger } from '../logger'

export class ResourceResolverManager {
  private currentResolver: ResourceResolver | null = null
  private projectRoot: string | null = null

  /** 设置项目根目录（会清理 file:// 前缀） */
  public setProjectRoot(projectRoot: string): void {
    const cleanProjectRoot = projectRoot && projectRoot.startsWith('file://')
      ? URI.parse(projectRoot).fsPath
      : projectRoot

    this.projectRoot = cleanProjectRoot
    logger.getConsola().info('[resource-resolver] project root set to:', this.projectRoot)
  }

  /** 初始化解析器（若前置条件缺失则忽略） */
  public initialize(lspConfiguration: LanguageServerConfigManager): void {
    const sdkPath = this.getCurrentSdkPath(lspConfiguration)
    if (!this.projectRoot || !sdkPath) {
      logger.getConsola().info('[resource-resolver] skip initialize: missing project root or sdkPath')
      return
    }

    logger.getConsola().info('[resource-resolver] initializing with sdkPath:', sdkPath)
    this.currentResolver = new ResourceResolver(logger, this.projectRoot, sdkPath)
    this.currentResolver.buildIndex().catch((error) => {
      logger.getConsola().error('[resource-resolver] buildIndex failed:', error)
    })
  }

  /** 确保解析器存在且 SDK 路径最新 */
  public ensureInitialized(lspConfiguration: LanguageServerConfigManager): boolean {
    const sdkPath = this.getCurrentSdkPath(lspConfiguration)
    if (!sdkPath) {
      logger.getConsola().info('[resource-resolver] no sdkPath available')
      return false
    }

    if (!this.projectRoot) {
      logger.getConsola().info('[resource-resolver] project root not set')
      return false
    }

    if (!this.currentResolver || sdkPath !== this.currentResolver.getSdkPath()) {
      logger.getConsola().info('[resource-resolver] (re)initialize required')
      this.initialize(lspConfiguration)
    }

    return this.currentResolver !== null
  }

  /** 获取解析器实例 */
  public getResolver(): ResourceResolver | null {
    return this.currentResolver
  }

  /** 获取所有索引资源（若未初始化则返回空数组） */
  public getAllResources(): ResourceIndexItem[] {
    return this.currentResolver ? this.currentResolver.getAllResources() : []
  }

  private getCurrentSdkPath(lspConfiguration: LanguageServerConfigManager): string | undefined {
    try {
      return lspConfiguration.getSdkPath()
    }
    catch (error) {
      logger.getConsola().error('[resource-resolver] getSdkPath error:', error)
      return undefined
    }
  }

  private static instance: ResourceResolverManager | null = null

  static getInstance(): ResourceResolverManager {
    if (!this.instance) {
      this.instance = new ResourceResolverManager()
    }
    return this.instance
  }
}
