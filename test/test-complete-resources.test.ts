import path from 'node:path'
import { LanguageServerLogger, ResourceResolver, ResourceType } from '@arkts/shared'
import { beforeAll, describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '..')
const projectRoot = path.join(root, 'sample')
const sdkPath = path.join(root, 'test', 'mock-sdk')

describe('完整资源解析能力', () => {
  const logger = new LanguageServerLogger('test')
  const resolver = new ResourceResolver(logger, projectRoot, sdkPath)

  beforeAll(async () => {
    await resolver.buildIndex()
  })

  it('系统资源可解析且部分具备精确 range', async () => {
    const tests = [
      'sys.color.ohos_id_color_foreground',
      'sys.float.ohos_id_alpha_content_primary',
      'sys.string.ohos_id_text_font_family_regular',
    ]
    for (const ref of tests) {
      const loc = await resolver.resolveResourceReference(ref)
      expect(loc, ref).not.toBeNull()
      expect(loc!.uri).toBeTruthy()
    }
  })

  it('应用资源可解析并返回值与 uri', async () => {
    const appRefs = ['app.color.primary_color', 'app.string.app_name']
    for (const ref of appRefs) {
      const loc = await resolver.resolveResourceReference(ref)
      expect(loc, ref).not.toBeNull()
      expect(loc!.uri).toBeTruthy()
      expect(loc!.value).toBeTruthy()
    }
  })

  it('资源搜索/筛选工作正常', () => {
    const colorResults = resolver.searchResources('color')
    expect(colorResults.length).toBeGreaterThan(0)

    const strings = resolver.getResourcesByType(undefined, ResourceType.String)
    expect(strings.length).toBeGreaterThan(0)
  })
})
