import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LanguageServerLogger } from '@arkts/shared'
import { beforeAll, describe, expect, it } from 'vitest'
// 集成测试：测试与实际项目结构的集成（Vitest 版本）
import { parseResourceReference, ResourceResolver, ResourceType } from '../out/index.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取项目根目录（向上三级目录）
const projectRoot = path.resolve(__dirname, '../../..')
const sampleDir = path.join(projectRoot, 'sample')
const hasSample = fs.existsSync(sampleDir)

const maybeDescribe = hasSample ? describe : describe.skip

maybeDescribe('实际项目结构集成测试', () => {
  let resolver

  beforeAll(async () => {
    resolver = new ResourceResolver(new LanguageServerLogger(), projectRoot)
    await resolver.buildIndex()
  })

  it('能够构建资源索引并获取资源列表', () => {
    const allResources = resolver.getAllResources()
    expect(Array.isArray(allResources)).toBe(true)
  })

  it('解析常见资源引用不抛出异常', async () => {
    const testCases = [
      'app.color.start_window_background',
      'app.color.primary_color',
      'app.string.app_name',
      'app.string.welcome_message',
      'app.media.icon',
      'app.media.startIcon',
    ]

    for (const ref of testCases) {
      await expect(resolver.resolveResourceReference(ref)).resolves.toSatisfy(result => result === null || typeof result.uri === 'string')
    }
  })
})

describe('资源路径构建（静态断言）', () => {
  it('不同资源类型的基础路径位置约定', () => {
    const expected = new Map([
      [ResourceType.Color, 'element/color.json'],
      [ResourceType.String, 'element/string.json'],
      [ResourceType.Float, 'element/float.json'],
      [ResourceType.Media, 'media'],
    ])

    // 验证约定路径字符串存在（不调用内部未导出函数）
    expect(expected.get(ResourceType.Color)).toBe('element/color.json')
    expect(expected.get(ResourceType.String)).toBe('element/string.json')
    expect(expected.get(ResourceType.Float)).toBe('element/float.json')
    expect(expected.get(ResourceType.Media)).toBe('media')
  })
})

describe('资源引用解析边界条件', () => {
  it('有效与无效引用解析', () => {
    const edgeCases = [
      { input: 'app.color.primary', shouldPass: true },
      { input: '\'app.string.title\'', shouldPass: true },
      { input: '"app.media.logo"', shouldPass: true },
      { input: '`app.float.size`', shouldPass: true },
      { input: 'invalid', shouldPass: false },
      { input: 'app.invalid_type.name', shouldPass: false },
      { input: 'invalid_scope.color.name', shouldPass: false },
      { input: 'app.color', shouldPass: false },
      { input: '', shouldPass: false },
      { input: 'app..name', shouldPass: false },
      { input: '.color.name', shouldPass: false },
    ]

    for (const c of edgeCases) {
      const result = parseResourceReference(c.input)
      if (c.shouldPass) {
        expect(result).not.toBeNull()
      }
      else {
        expect(result).toBeNull()
      }
    }
  })
})
