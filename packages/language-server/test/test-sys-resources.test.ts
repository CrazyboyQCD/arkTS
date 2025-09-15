import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { LanguageServerLogger, ResourceResolver } from '../../shared/src/index'

const root = path.resolve(__dirname, '..')
const projectRoot = path.join(root, 'sample')
const sdkPath = path.join(root, 'test', 'mock-sdk')

describe('sys 系统资源解析', () => {
  const logger = new LanguageServerLogger('test')
  const resolver = new ResourceResolver(logger, projectRoot, sdkPath)

  beforeAll(async () => {
    await resolver.buildIndex()
  })

  it('常见 sys 引用均可解析', async () => {
    const refs = [
      'sys.color.ohos_id_color_foreground',
      'sys.string.ohos_id_text_font_family_regular',
      'sys.float.ohos_id_alpha_content_primary',
      'sys.media.ohos_app_icon',
      'sys.symbol.ohos_wifi',
    ]
    for (const ref of refs) {
      const r = await resolver.resolveResourceReference(ref)
      expect(r, ref).not.toBeNull()
      expect(r!.uri).toBeTruthy()
    }
  })

  it('不存在的 sys 引用返回 null', async () => {
    const refs = ['sys.color.nonexistent_color', 'sys.string.missing_string']
    for (const ref of refs) {
      const r = await resolver.resolveResourceReference(ref)
      expect(r, ref).toBeNull()
    }
  })
})
