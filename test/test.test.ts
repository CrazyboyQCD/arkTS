import fs from 'node:fs'
import path from 'node:path'
import { LanguageServerLogger, ResourceResolver } from '@arkts/shared'
import { beforeAll, describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '..')
const projectRoot = path.join(root, 'sample')
const sdkPath = path.join(root, 'test', 'mock-sdk')
const sysResourcePath = path.join(sdkPath, 'ets', 'build-tools', 'ets-loader', 'sysResource.js')

function findSysResourceItemRange(lines: string[], resourceName: string, resourceType: string) {
  let inResourceTypeSection = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.includes(`${resourceType}:`)) {
      inResourceTypeSection = true
      continue
    }
    if (inResourceTypeSection) {
      if (line.includes('}') && !line.includes(resourceName)) {
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
        if (nextLine === '' || nextLine.includes(':') || nextLine === '}') {
          inResourceTypeSection = false
          continue
        }
      }
      if (line.includes(resourceName)) {
        const originalLine = lines[i]
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

describe('sysResource 文件精确定位', () => {
  it('可以在 sysResource.js 中定位常见 sys 资源', () => {
    expect(fs.existsSync(sysResourcePath)).toBe(true)
    const content = fs.readFileSync(sysResourcePath, 'utf-8')
    const lines = content.split('\n')
    const testCases = [
      { name: 'ohos_id_color_foreground', type: 'color' },
      { name: 'ohos_id_alpha_content_primary', type: 'float' },
      { name: 'ohos_id_text_font_family_regular', type: 'string' },
      { name: 'ohos_app_icon', type: 'media' },
      { name: 'ohos_wifi', type: 'symbol' },
      { name: 'selecttitlebar_accessibility_message_desc_new', type: 'plural' },
    ]
    for (const t of testCases) {
      const range = findSysResourceItemRange(lines, t.name, t.type)
      expect(range, `${t.type}.${t.name}`).toBeTruthy()
    }
  })
})

describe('resourceResolver 精确导航（包含 range）', () => {
  const logger = new LanguageServerLogger('test')
  const resolver = new ResourceResolver(logger, projectRoot, sdkPath)

  beforeAll(async () => {
    await resolver.buildIndex()
  })

  it('sys 资源返回带 range 的位置', async () => {
    const refs = [
      'sys.color.ohos_id_color_foreground',
      'sys.float.ohos_id_alpha_content_primary',
      'sys.string.ohos_id_text_font_family_regular',
    ]
    for (const ref of refs) {
      const loc = await resolver.resolveResourceReference(ref)
      expect(loc, ref).not.toBeNull()
      expect(loc!.range, `${ref} should have range`).toBeTruthy()
    }
  })
})

describe('sDK 路径动态获取（概念验证）', () => {
  class MockConfigManager {
    private config = { ohos: { sdkPath: '' } }
    getSdkPath() { return this.config.ohos.sdkPath }
    setConfiguration(cfg: any) {
      if (cfg.ohos?.sdkPath)
        this.config.ohos.sdkPath = cfg.ohos.sdkPath
    }
  }

  it('更新配置后，动态 getter 返回最新 SDK 路径', () => {
    const config = new MockConfigManager()
    const getter = () => config.getSdkPath()
    expect(getter()).toBe('')
    config.setConfiguration({ ohos: { sdkPath: 'd:\\Develop\\ENV_SDK\\OpenHarmony\\20' } })
    expect(getter()).toContain('OpenHarmony')
  })
})
