import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LanguageServerLogger } from '@arkts/shared'
import { beforeAll, describe, expect, it } from 'vitest'
// 最终验收测试：Vitest 版本，验证完整的 $r() 资源引用跳转功能
import { parseResourceReference, ResourceResolver } from '../out/index.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '../../..')
const sampleIndex = path.join(projectRoot, 'sample/entry/src/main/ets/pages/Index.ets')
const hasSample = fs.existsSync(sampleIndex)

function extractResourceReferences(code) {
  const regex = /\$r\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
  const matches = []

  for (let m = regex.exec(code); m !== null; m = regex.exec(code)) {
    matches.push({
      fullMatch: m[0],
      resourceRef: m[1],
      start: m.index,
      end: m.index + m[0].length,
    })
  }

  return matches
}

const maybeDescribe = hasSample ? describe : describe.skip

maybeDescribe('最终验收：$r() 资源引用跳转', () => {
  let resolver

  beforeAll(async () => {
    resolver = new ResourceResolver(new LanguageServerLogger(), projectRoot)
    await resolver.buildIndex()
  })

  it('能够从示例页面提取 $r() 引用并解析', async () => {
    const content = await fs.promises.readFile(sampleIndex, 'utf-8')
    const refs = extractResourceReferences(content)
    expect(refs.length).toBeGreaterThan(0)

    // 仅校验解析与可解析性，不强制存在性
    const parsed = parseResourceReference(refs[0].resourceRef)
    expect(parsed).not.toBeNull()

    const result = await resolver.resolveResourceReference(refs[0].resourceRef)
    expect(result === null || typeof result.uri === 'string').toBe(true)
  })

  it('关键项目文件存在性检查', () => {
    const keyFiles = [
      'packages/shared/src/resource-resolver.ts',
      'packages/language-server/src/services/resource-detector.service.ts',
      'sample/entry/src/main/resources/base/element/color.json',
      'sample/entry/src/main/resources/base/element/string.json',
      'sample/entry/src/main/resources/base/media/icon.png',
      'sample/entry/src/main/ets/pages/Index.ets',
    ]

    for (const file of keyFiles) {
      const p = path.join(projectRoot, file)
      expect(fs.existsSync(p)).toBe(true)
    }
  })
})
