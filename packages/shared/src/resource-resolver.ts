import type { LanguageServerLogger } from './log/lsp-logger'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { URI } from 'vscode-uri'

/**
 * 资源类型枚举
 */
export enum ResourceType {
  Color = 'color',
  String = 'string',
  Float = 'float',
  Boolean = 'boolean',
  Integer = 'integer',
  Media = 'media',
  Profile = 'profile',
  Symbol = 'symbol',
  Plural = 'plural',
}

/**
 * 资源引用解析结果
 */
export interface ResourceReference {
  /** 资源类型 (app 或 sys) */
  scope: 'app' | 'sys'
  /** 资源类型 */
  type: ResourceType
  /** 资源名称 */
  name: string
  /** 原始引用字符串 */
  raw: string
}

/**
 * 资源位置信息
 */
export interface ResourceLocation {
  /** 文件URI */
  uri: string
  /** 在文件中的位置（对于JSON资源） */
  range?: {
    start: { line: number, character: number }
    end: { line: number, character: number }
  }
  /** 资源值 */
  value?: string
}

/**
 * 资源索引项
 */
export interface ResourceIndexItem {
  /** 资源引用 */
  reference: ResourceReference
  /** 资源位置 */
  location: ResourceLocation
}

/**
 * 解析 $r() 资源引用字符串
 * @param resourceRef 资源引用字符串，如 'app.color.bg_color' 或 'sys.string.title'
 * @returns 解析结果
 */
export function parseResourceReference(resourceRef: string): ResourceReference | null {
  // 移除引号
  const cleanRef = resourceRef.replace(/^['"`]|['"`]$/g, '')

  // 匹配模式: {scope}.{type}.{name}
  const match = cleanRef.match(/^(app|sys)\.(\w+)\.(\w+)$/)
  if (!match) {
    return null
  }

  const [, scope, type, name] = match

  // 验证资源类型
  if (!Object.values(ResourceType).includes(type as ResourceType)) {
    return null
  }

  return {
    scope: scope as 'app' | 'sys',
    type: type as ResourceType,
    name,
    raw: resourceRef,
  }
}

/**
 * 构建资源文件路径
 * @param projectRoot 项目根路径
 * @param moduleName 模块名（如 'entry', 'sampleLibrary'）
 * @param resourceType 资源类型
 * @returns 资源文件路径
 */
export function buildResourceFilePath(
  projectRoot: string,
  moduleName: string,
  resourceType: ResourceType,
): string {
  const basePath = path.join(projectRoot, moduleName, 'src', 'main', 'resources', 'base')

  if (resourceType === ResourceType.Media) {
    return path.join(basePath, 'media')
  }
  else {
    return path.join(basePath, 'element', `${resourceType}.json`)
  }
}

/**
 * 资源解析器类
 */
export class ResourceResolver {
  private projectRoot: string
  private resourceIndex: Map<string, ResourceIndexItem> = new Map()
  private sdkPath?: string

  getSdkPath(): string | undefined {
    return this.sdkPath
  }

  getProjectRoot(): string {
    return this.projectRoot
  }

  constructor(private readonly logger: LanguageServerLogger, projectRoot: string, sdkPath?: string) {
    this.projectRoot = projectRoot
    this.sdkPath = sdkPath
  }

  /**
   * 查找项目中的所有模块
   */
  private async findModules(): Promise<string[]> {
    const modules: string[] = []

    try {
      await this.findModulesRecursive(this.projectRoot, '', modules, 3) // 最多递归3层
    }
    catch (error) {
      console.error('Failed to find modules:', error)
    }

    return modules
  }

  /**
   * 递归查找模块
   */
  private async findModulesRecursive(currentPath: string, relativePath: string, modules: string[], maxDepth: number): Promise<void> {
    if (maxDepth <= 0) {
      return
    }

    try {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          const fullPath = path.join(currentPath, entry.name)
          const moduleRelativePath = relativePath ? path.join(relativePath, entry.name) : entry.name

          // 检查是否是模块（包含 src/main/module.json5 文件）
          const moduleJsonPath = path.join(fullPath, 'src', 'main', 'module.json5')

          if (fs.existsSync(moduleJsonPath)) {
            this.logger.getConsola().log(`Found module: ${moduleRelativePath} at ${fullPath}`)
            modules.push(moduleRelativePath)
          }
          else {
            // 如果不是模块，继续递归查找
            await this.findModulesRecursive(fullPath, moduleRelativePath, modules, maxDepth - 1)
          }
        }
      }
    }
    catch (error) {
      // 忽略无法访问的目录
      this.logger.getConsola().error(`Cannot access directory ${currentPath}:`, error)
    }
  }

  /**
   * 判断是否应该跳过某个目录
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      '.vscode',
      '.idea',
      'dist',
      'build',
      'out',
      '.changeset',
      '.github',
      '.qoder',
      'screenshots',
      'hvigor',
      'autosign',
    ]

    return skipDirs.includes(dirName) || dirName.startsWith('.')
  }

  /**
   * 构建资源索引
   */
  async buildIndex(): Promise<void> {
    this.resourceIndex.clear()
    this.logger.getConsola().log(`Building resource index for project: ${this.projectRoot}`)

    // 索引 app 资源（模块资源）
    const modules = await this.findModules()
    this.logger.getConsola().log(`Found ${modules.length} modules:`, modules)

    for (const moduleName of modules) {
      this.logger.getConsola().log(`Indexing module: ${moduleName}`)
      await this.indexModule(moduleName)
    }

    // 索引 sys 资源（系统资源）
    await this.indexSystemResources()

    this.logger.getConsola().log(`Resource index built with ${this.resourceIndex.size} resources`)
  }

  /**
   * 为特定模块构建索引
   */
  private async indexModule(moduleName: string): Promise<void> {
    const basePath = path.join(this.projectRoot, moduleName, 'src', 'main', 'resources', 'base')

    // 索引 element 文件夹中的 JSON 资源
    await this.indexElementResources(basePath, moduleName)

    // 索引 media 文件夹中的媒体资源
    await this.indexMediaResources(basePath, moduleName)
  }

  /**
   * 索引元素资源（JSON文件）
   */
  private async indexElementResources(basePath: string, moduleName: string): Promise<void> {
    const elementPath = path.join(basePath, 'element')

    if (!fs.existsSync(elementPath)) {
      return
    }

    try {
      const files = await fs.promises.readdir(elementPath)

      for (const file of files) {
        if (file.endsWith('.json')) {
          const resourceType = path.basename(file, '.json') as ResourceType
          if (Object.values(ResourceType).includes(resourceType)) {
            await this.indexJsonResource(path.join(elementPath, file), resourceType)
          }
        }
      }
    }
    catch (error) {
      this.logger.getConsola().error(`Failed to index element resources for ${moduleName}:`, error)
    }
  }

  /**
   * 索引JSON资源文件
   */
  private async indexJsonResource(filePath: string, resourceType: ResourceType): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8')
      const json = JSON.parse(content)
      const lines = content.split('\n')

      if (json[resourceType] && Array.isArray(json[resourceType])) {
        for (const item of json[resourceType]) {
          if (item.name && item.value) {
            // 找到资源在文件中的位置
            const range = this.findJsonItemRange(lines, item.name)

            const reference: ResourceReference = {
              scope: 'app',
              type: resourceType,
              name: item.name,
              raw: `app.${resourceType}.${item.name}`,
            }

            const location: ResourceLocation = {
              uri: URI.file(filePath).toString(),
              range,
              value: item.value,
            }

            const key = `${reference.scope}.${reference.type}.${reference.name}`
            this.resourceIndex.set(key, { reference, location })
          }
        }
      }
    }
    catch (error) {
      this.logger.getConsola().error(`Failed to index JSON resource ${filePath}:`, error)
    }
  }

  /**
   * 索引系统资源（sys 资源）
   */
  private async indexSystemResources(): Promise<void> {
    if (!this.sdkPath) {
      this.logger.getConsola().log('SDK path not provided, skipping system resource indexing')
      return
    }

    const sysResourcePath = path.join(this.sdkPath, 'ets', 'build-tools', 'ets-loader', 'sysResource.js')

    if (!fs.existsSync(sysResourcePath)) {
      this.logger.getConsola().log(`System resource file not found: ${sysResourcePath}`)
      return
    }

    try {
      this.logger.getConsola().log(`Indexing system resources from: ${sysResourcePath}`)

      // 读取文件内容
      const content = await fs.promises.readFile(sysResourcePath, 'utf-8')

      // 解析 JavaScript 模块内容
      const sysResources = this.parseSysResourceFile(content)

      if (sysResources) {
        this.indexSysResourceObject(sysResources, sysResourcePath)
        this.logger.getConsola().log('System resources indexed successfully')
      }
    }
    catch (error) {
      this.logger.getConsola().error('Failed to index system resources:', error)
    }
  }

  /**
   * 解析 sysResource.js 文件内容
   */
  private parseSysResourceFile(content: string): any {
    try {
      // 移除 module.exports 并解析 JavaScript 对象
      const moduleMatch = content.match(/module\.exports\.sys\s*=\s*(\{[\s\S]*\})/)
      if (!moduleMatch) {
        this.logger.getConsola().error('Unable to parse sys resource module structure')
        return null
      }

      // 使用 Function 构造函数安全执行 JavaScript
      const objectStr = moduleMatch[1]
      // eslint-disable-next-line no-new-func
      const sysResources = new Function(`return ${objectStr}`)()

      return sysResources
    }
    catch (error) {
      this.logger.getConsola().error('Failed to parse sysResource.js content:', error)
      return null
    }
  }

  /**
   * 索引系统资源对象
   */
  private indexSysResourceObject(sysResources: any, filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    for (const [resourceType, resources] of Object.entries(sysResources)) {
      if (typeof resources === 'object' && resources !== null) {
        for (const [resourceName, resourceId] of Object.entries(resources)) {
          // 查找资源在文件中的精确位置
          const range = this.findSysResourceItemRange(lines, resourceName, resourceType)

          const reference: ResourceReference = {
            scope: 'sys',
            type: resourceType as ResourceType,
            name: resourceName,
            raw: `sys.${resourceType}.${resourceName}`,
          }

          const location: ResourceLocation = {
            uri: URI.file(filePath).toString(),
            range,
            value: `System Resource ID: ${resourceId}`,
          }

          const key = `${reference.scope}.${reference.type}.${reference.name}`
          this.resourceIndex.set(key, { reference, location })
        }
      }
    }
  }

  /**
   * 在系统资源文件中查找指定资源的位置
   */
  private findSysResourceItemRange(
    lines: string[],
    resourceName: string,
    resourceType: string,
  ): { start: { line: number, character: number }, end: { line: number, character: number } } | undefined {
    let inResourceTypeSection = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // 检查是否进入了对应的资源类型段落
      if (line.includes(`${resourceType}:`)) {
        inResourceTypeSection = true
        continue
      }

      // 如果在资源类型段落中
      if (inResourceTypeSection) {
        // 检查是否离开了当前段落（到了下一个类型或结束）
        if (line.includes('}') && !line.includes(resourceName)) {
          // 检查是否是结束大括号，且不包含目标资源
          const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
          if (nextLine === '' || nextLine.includes(':') || nextLine === '}') {
            inResourceTypeSection = false
            continue
          }
        }

        // 在当前段落中查找具体的资源名称
        if (line.includes(resourceName)) {
          const originalLine = lines[i] // 保持原始的空格
          const start = originalLine.indexOf(resourceName)
          if (start >= 0) {
            return {
              start: { line: i, character: start },
              end: { line: i, character: start + resourceName.length },
            }
          }
        }
      }
    }

    return undefined
  }

  /**
   * 索引媒体资源
   */
  private async indexMediaResources(basePath: string, moduleName: string): Promise<void> {
    const mediaPath = path.join(basePath, 'media')

    if (!fs.existsSync(mediaPath)) {
      return
    }

    try {
      const files = await fs.promises.readdir(mediaPath)

      for (const file of files) {
        const filePath = path.join(mediaPath, file)
        const stat = await fs.promises.stat(filePath)

        if (stat.isFile()) {
          const name = path.basename(file, path.extname(file))

          const reference: ResourceReference = {
            scope: 'app',
            type: ResourceType.Media,
            name,
            raw: `app.media.${name}`,
          }

          const location: ResourceLocation = {
            uri: URI.file(filePath).toString(),
            value: file,
          }

          const key = `${reference.scope}.${reference.type}.${reference.name}`
          this.resourceIndex.set(key, { reference, location })
        }
      }
    }
    catch (error) {
      console.error(`Failed to index media resources for ${moduleName}:`, error)
    }
  }

  /**
   * 在JSON文件中查找指定名称的项的位置
   */
  private findJsonItemRange(lines: string[], itemName: string): { start: { line: number, character: number }, end: { line: number, character: number } } | undefined {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const nameMatch = line.match(new RegExp(`"name"\\s*:\\s*"${itemName}"`))

      if (nameMatch) {
        const start = line.indexOf(`"${itemName}"`)
        return {
          start: { line: i, character: start },
          end: { line: i, character: start + itemName.length + 2 }, // +2 for quotes
        }
      }
    }

    return undefined
  }

  /**
   * 解析资源引用并返回位置
   */
  async resolveResourceReference(resourceRef: string): Promise<ResourceLocation | null> {
    const parsed = parseResourceReference(resourceRef)
    if (!parsed) {
      return null
    }

    const key = `${parsed.scope}.${parsed.type}.${parsed.name}`
    const item = this.resourceIndex.get(key)

    return item?.location || null
  }

  /**
   * 获取所有已索引的资源
   */
  getAllResources(): ResourceIndexItem[] {
    return Array.from(this.resourceIndex.values())
  }

  /**
   * 根据关键字搜索资源
   */
  searchResources(keyword: string, scope?: 'app' | 'sys', type?: ResourceType): ResourceIndexItem[] {
    const results: ResourceIndexItem[] = []
    const lowerKeyword = keyword.toLowerCase()

    for (const item of this.resourceIndex.values()) {
      // 过滤范围
      if (scope && item.reference.scope !== scope) {
        continue
      }

      // 过滤类型
      if (type && item.reference.type !== type) {
        continue
      }

      // 关键字匹配（资源名称或值）
      const matchesName = item.reference.name.toLowerCase().includes(lowerKeyword)
      const matchesValue = item.location.value?.toLowerCase().includes(lowerKeyword) || false

      if (matchesName || matchesValue) {
        results.push(item)
      }
    }

    // 按相关性排序（名称匹配的优先级更高）
    return results.sort((a, b) => {
      const aNameMatch = a.reference.name.toLowerCase().includes(lowerKeyword)
      const bNameMatch = b.reference.name.toLowerCase().includes(lowerKeyword)

      if (aNameMatch && !bNameMatch)
        return -1
      if (!aNameMatch && bNameMatch)
        return 1

      // 同样的匹配类型，按字母顺序排序
      return a.reference.name.localeCompare(b.reference.name)
    })
  }

  /**
   * 获取指定范围和类型的所有资源
   */
  getResourcesByType(scope?: 'app' | 'sys', type?: ResourceType): ResourceIndexItem[] {
    const results: ResourceIndexItem[] = []

    for (const item of this.resourceIndex.values()) {
      if (scope && item.reference.scope !== scope) {
        continue
      }

      if (type && item.reference.type !== type) {
        continue
      }

      results.push(item)
    }

    return results.sort((a, b) => a.reference.name.localeCompare(b.reference.name))
  }

  /**
   * 清除索引
   */
  clearIndex(): void {
    this.resourceIndex.clear()
  }
}
