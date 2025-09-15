import fs from 'node:fs'
import path from 'node:path'
import { LanguageServerLogger, parseResourceReference, ResourceResolver } from '@arkts/shared'
import { beforeAll, describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../../..')
const projectRoot = path.join(root, 'sample')
const sdkPath = path.join(root, 'test', 'mock-sdk')

describe('lSP 定义跳转相关能力（资源解析与样例验证）', () => {
  const logger = new LanguageServerLogger('test')
  const resolver = new ResourceResolver(logger, projectRoot, sdkPath)

  beforeAll(async () => {
    await resolver.buildIndex()
  })

  it('index.ets 中应包含若干 $r() 引用示例行', () => {
    const indexFilePath = path.join(projectRoot, 'entry/src/main/ets/pages/Index.ets')
    expect(fs.existsSync(indexFilePath)).toBe(true)
    const content = fs.readFileSync(indexFilePath, 'utf-8')
    const lines = content.split('\n')
    const count = lines.filter(l => l.includes('$r(')).length
    expect(count).toBeGreaterThan(0)
  })

  it('resourceResolver 能解析常见资源并返回有效位置/值', async () => {
    const tests = [
      'app.string.app_name',
      'app.color.primary_color',
      'app.color.start_window_background',
      'app.media.icon',
    ]
    for (const ref of tests) {
      const loc = await resolver.resolveResourceReference(ref)
      expect(loc, ref).not.toBeNull()
      expect(loc!.uri).toBeTruthy()
    }
  })

  it('parseResourceReference 能识别多种引号包裹的引用', () => {
    const refs = [
      '\'app.color.primary_color\'',
      '"app.color.primary_color"',
      '`app.color.primary_color`',
    ]
    for (const r of refs) {
      const parsed = parseResourceReference(r)
      expect(parsed).not.toBeNull()
      expect(parsed!.scope).toBe('app')
      expect(parsed!.type).toBe('color')
      expect(parsed!.name).toBe('primary_color')
    }
  })
})
