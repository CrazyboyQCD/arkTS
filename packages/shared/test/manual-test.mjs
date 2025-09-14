// 简单的手动测试脚本，验证资源解析器功能
import { parseResourceReference, ResourceType, ResourceResolver } from '../out/index.mjs'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 测试函数
function test(name, fn) {
  console.log(`Testing: ${name}`)
  try {
    const result = fn()
    if (result instanceof Promise) {
      result.then(() => {
        console.log(`✅ ${name} passed`)
      }).catch(error => {
        console.error(`❌ ${name} failed:`, error)
      })
    } else {
      console.log(`✅ ${name} passed`)
    }
  } catch (error) {
    console.error(`❌ ${name} failed:`, error)
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`)
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`)
      }
    },
    toBeNull: () => {
      if (actual !== null) {
        throw new Error(`Expected null, but got ${actual}`)
      }
    },
    toBeGreaterThan: (expected) => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`)
      }
    }
  }
}

// 运行测试
console.log('开始测试资源解析器...\n')

// 测试 parseResourceReference
test('parseResourceReference - valid app resource', () => {
  const result = parseResourceReference('app.color.bg_color')
  expect(result).toEqual({
    scope: 'app',
    type: ResourceType.Color,
    name: 'bg_color',
    raw: 'app.color.bg_color',
  })
})

test('parseResourceReference - valid sys resource', () => {
  const result = parseResourceReference('sys.string.title')
  expect(result).toEqual({
    scope: 'sys',
    type: ResourceType.String,
    name: 'title',
    raw: 'sys.string.title',
  })
})

test('parseResourceReference - media resource', () => {
  const result = parseResourceReference('app.media.logo')
  expect(result).toEqual({
    scope: 'app',
    type: ResourceType.Media,
    name: 'logo',
    raw: 'app.media.logo',
  })
})

test('parseResourceReference - with quotes', () => {
  const result1 = parseResourceReference("'app.color.bg_color'")
  const result2 = parseResourceReference('"app.color.bg_color"')
  const result3 = parseResourceReference('`app.color.bg_color`')
  
  expect(result1?.name).toBe('bg_color')
  expect(result2?.name).toBe('bg_color')
  expect(result3?.name).toBe('bg_color')
})

test('parseResourceReference - invalid format', () => {
  expect(parseResourceReference('invalid')).toBeNull()
  expect(parseResourceReference('app.invalid_type.name')).toBeNull()
  expect(parseResourceReference('invalid_scope.color.name')).toBeNull()
  expect(parseResourceReference('')).toBeNull()
})

test('parseResourceReference - float type', () => {
  const result = parseResourceReference('app.float.text_size')
  expect(result).toEqual({
    scope: 'app',
    type: ResourceType.Float,
    name: 'text_size',
    raw: 'app.float.text_size',
  })
})

// 测试 ResourceResolver
test('ResourceResolver - basic functionality', async () => {
  const tempDir = path.join(__dirname, 'temp-test-project')
  
  try {
    // 创建测试目录结构
    const entryModule = path.join(tempDir, 'entry')
    const resourcesDir = path.join(entryModule, 'src', 'main', 'resources', 'base')
    const elementDir = path.join(resourcesDir, 'element')
    const mediaDir = path.join(resourcesDir, 'media')

    await fs.promises.mkdir(elementDir, { recursive: true })
    await fs.promises.mkdir(mediaDir, { recursive: true })

    // 创建 color.json
    const colorJson = {
      color: [
        { name: 'primary', value: '#1976D2' },
        { name: 'secondary', value: '#424242' },
      ],
    }
    await fs.promises.writeFile(
      path.join(elementDir, 'color.json'),
      JSON.stringify(colorJson, null, 2)
    )

    // 创建媒体文件
    await fs.promises.writeFile(path.join(mediaDir, 'logo.png'), 'fake-image-data')
    
    const resolver = new ResourceResolver(tempDir)
    await resolver.buildIndex()

    // 测试解析颜色资源
    const colorResult = await resolver.resolveResourceReference('app.color.primary')
    if (!colorResult) {
      throw new Error('Expected color result to not be null')
    }
    expect(colorResult.value).toBe('#1976D2')
    
    if (!colorResult.uri.includes('color.json')) {
      throw new Error('Expected URI to contain color.json')
    }

    // 测试解析媒体资源
    const mediaResult = await resolver.resolveResourceReference('app.media.logo')
    if (!mediaResult) {
      throw new Error('Expected media result to not be null')
    }
    expect(mediaResult.value).toBe('logo.png')
    
    if (!mediaResult.uri.includes('logo.png')) {
      throw new Error('Expected URI to contain logo.png')
    }

    // 清理测试文件
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true })
    }
    
  } catch (error) {
    // 确保清理测试文件
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true })
    }
    throw error
  }
})

console.log('\n测试完成！')