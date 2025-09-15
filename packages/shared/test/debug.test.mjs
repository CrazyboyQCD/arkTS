import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LanguageServerLogger } from '@arkts/shared'
import { beforeAll, describe, expect, it } from 'vitest'
import { ResourceResolver } from '../out/index.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取项目根目录（向上三级目录）
const projectRoot = path.resolve(__dirname, '../../..')
const sampleRoot = path.join(projectRoot, 'sample')
const hasSample = fs.existsSync(sampleRoot)

describe('资源模块发现与结构检查', () => {
  it('能够罗列项目根下的可能模块目录', async () => {
    const entries = await fs.promises.readdir(projectRoot, { withFileTypes: true })
    const moduleNames = entries
      .filter(e => e.isDirectory() && e.name !== 'node_modules' && e.name !== '.git')
      .map(e => e.name)
    expect(Array.isArray(moduleNames)).toBe(true)
  })

  const maybeTest = hasSample ? it : it.skip
  maybeTest('sample 模块存在且包含资源目录', async () => {
    const basePath = path.join(sampleRoot, 'entry', 'src', 'main', 'resources', 'base')
    expect(fs.existsSync(basePath)).toBe(true)

    const elementPath = path.join(basePath, 'element')
    const mediaPath = path.join(basePath, 'media')
    expect(fs.existsSync(elementPath)).toBe(true)
    expect(fs.existsSync(mediaPath)).toBe(true)
  })
})

const maybeDescribe = hasSample ? describe : describe.skip
maybeDescribe('以 sample 作为根目录的资源解析', () => {
  let resolver

  beforeAll(async () => {
    resolver = new ResourceResolver(new LanguageServerLogger(), sampleRoot)
    await resolver.buildIndex()
  })

  it('能够索引到资源并返回列表', () => {
    const resources = resolver.getAllResources()
    expect(Array.isArray(resources)).toBe(true)
  })
})
