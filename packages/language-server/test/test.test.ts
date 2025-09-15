import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { LanguageServerLogger, ResourceResolver } from '../../shared/src/index'

const root = path.resolve(__dirname, '..')
const projectRoot = path.join(root, 'sample')
const sdkPath = path.join(root, 'test', 'mock-sdk')
// const _sysResourcePath = path.join(sdkPath, 'ets', 'build-tools', 'ets-loader', 'sysResource.js')

// 移除与实现重复的精确定位测试，改由下方通过 ResourceResolver 验证 range

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

describe('sdk 路径动态获取（概念验证）', () => {
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
