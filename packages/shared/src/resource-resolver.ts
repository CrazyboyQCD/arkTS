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
  } else {
    return path.join(basePath, 'element', `${resourceType}.json`)
  }
}

/**
 * 资源解析器类
 */
export class ResourceResolver {
  private projectRoot: string
  private resourceIndex: Map<string, ResourceIndexItem> = new Map()

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  /**
   * 查找项目中的所有模块
   */
  private async findModules(): Promise<string[]> {
    const modules: string[] = []
    
    try {
      await this.findModulesRecursive(this.projectRoot, '', modules, 3) // 最多递归3层
    } catch (error) {
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
          
          // 检查是否是模块（包含 src/main/resources 目录）
          const resourcesPath = path.join(fullPath, 'src', 'main', 'resources')
          
          if (fs.existsSync(resourcesPath)) {
            modules.push(moduleRelativePath)
          } else {
            // 如果不是模块，继续递归查找
            await this.findModulesRecursive(fullPath, moduleRelativePath, modules, maxDepth - 1)
          }
        }
      }
    } catch (error) {
      // 忽略无法访问的目录
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
      'autosign'
    ]
    
    return skipDirs.includes(dirName) || dirName.startsWith('.')
  }

  /**
   * 构建资源索引
   */
  async buildIndex(): Promise<void> {
    this.resourceIndex.clear()
    const modules = await this.findModules()

    for (const moduleName of modules) {
      await this.indexModule(moduleName)
    }
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
            await this.indexJsonResource(path.join(elementPath, file), resourceType, moduleName)
          }
        }
      }
    } catch (error) {
      console.error(`Failed to index element resources for ${moduleName}:`, error)
    }
  }

  /**
   * 索引JSON资源文件
   */
  private async indexJsonResource(filePath: string, resourceType: ResourceType, moduleName: string): Promise<void> {
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
    } catch (error) {
      console.error(`Failed to index JSON resource ${filePath}:`, error)
    }
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
    } catch (error) {
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
   * 清除索引
   */
  clearIndex(): void {
    this.resourceIndex.clear()
  }
}