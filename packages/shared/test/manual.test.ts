import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LanguageServerLogger } from '../src/log/lsp-logger'
// 简单的手动测试脚本 -> 结构化为 Vitest 套件
import { parseResourceReference, ResourceResolver, ResourceType } from '../src/resource-resolver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('parseResourceReference 基础校验', () => {
  it('valid app resource', () => {
    const result = parseResourceReference('app.color.bg_color')
    expect(result).toEqual({
      scope: 'app',
      type: ResourceType.Color,
      name: 'bg_color',
      raw: 'app.color.bg_color',
    })
  })

  it('valid sys resource', () => {
    const result = parseResourceReference('sys.string.title')
    expect(result).toEqual({
      scope: 'sys',
      type: ResourceType.String,
      name: 'title',
      raw: 'sys.string.title',
    })
  })

  it('media resource', () => {
    const result = parseResourceReference('app.media.logo')
    expect(result).toEqual({
      scope: 'app',
      type: ResourceType.Media,
      name: 'logo',
      raw: 'app.media.logo',
    })
  })

  it('with quotes', () => {
    const result1 = parseResourceReference('\'app.color.bg_color\'')
    const result2 = parseResourceReference('"app.color.bg_color"')
    const result3 = parseResourceReference('`app.color.bg_color`')

    expect(result1?.name).toBe('bg_color')
    expect(result2?.name).toBe('bg_color')
    expect(result3?.name).toBe('bg_color')
  })

  it('invalid format', () => {
    expect(parseResourceReference('invalid')).toBeNull()
    expect(parseResourceReference('app.invalid_type.name')).toBeNull()
    expect(parseResourceReference('invalid_scope.color.name')).toBeNull()
    expect(parseResourceReference('')).toBeNull()
  })

  it('float type', () => {
    const result = parseResourceReference('app.float.text_size')
    expect(result).toEqual({
      scope: 'app',
      type: ResourceType.Float,
      name: 'text_size',
      raw: 'app.float.text_size',
    })
  })
})

describe('resourceResolver - 基本功能', () => {
  it('构建索引并解析颜色/媒体资源', async () => {
    const tempDir = path.join(__dirname, 'temp-test-project')

    try {
      const entryModule = path.join(tempDir, 'entry')
      const resourcesDir = path.join(entryModule, 'src', 'main', 'resources', 'base')
      const elementDir = path.join(resourcesDir, 'element')
      const mediaDir = path.join(resourcesDir, 'media')

      fs.mkdirSync(elementDir, { recursive: true })
      fs.mkdirSync(mediaDir, { recursive: true })

      // 确保被识别为模块
      fs.writeFileSync(path.join(entryModule, 'src', 'main', 'module.json5'), '{ "foo": "bar" }')

      const colorJson = {
        color: [
          { name: 'primary', value: '#1976D2' },
          { name: 'secondary', value: '#424242' },
        ],
      }
      fs.writeFileSync(path.join(elementDir, 'color.json'), JSON.stringify(colorJson, null, 2))
      fs.writeFileSync(path.join(mediaDir, 'logo.png'), 'fake-image-data')

      const resolver = new ResourceResolver(new LanguageServerLogger(), tempDir)
      await resolver.buildIndex()

      const colorResult = await resolver.resolveResourceReference('app.color.primary')
      expect(colorResult).not.toBeNull()
      expect(colorResult?.value).toBe('#1976D2')
      expect(colorResult?.uri.includes('color.json')).toBe(true)

      const mediaResult = await resolver.resolveResourceReference('app.media.logo')
      expect(mediaResult).not.toBeNull()
      expect(mediaResult?.value).toBe('logo.png')
      expect(mediaResult?.uri.includes('logo.png')).toBe(true)
    }
    finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    }
  })
})
