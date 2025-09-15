import type { ResourceIndexItem } from '@arkts/shared'
import { describe, expect, it } from 'vitest'
import { ResourceType } from '../../shared/src/resource-resolver'
import { generateResourceCompletionItems } from '../src/services/resource-completion.service'

// 模拟数据，用于单元测试
const mockResources: ResourceIndexItem[] = [
  { reference: { scope: 'app', type: ResourceType.Color, name: 'primary_color', raw: 'app.color.primary_color' }, location: { uri: 'file:///mock/app/color.json', value: '#ff0000' } },
  { reference: { scope: 'app', type: ResourceType.Color, name: 'bg_color', raw: 'app.color.bg_color' }, location: { uri: 'file:///mock/app/color.json', value: '#ffffff' } },
  { reference: { scope: 'app', type: ResourceType.String, name: 'title', raw: 'app.string.title' }, location: { uri: 'file:///mock/app/string.json', value: 'Welcome' } },
  { reference: { scope: 'sys', type: ResourceType.Color, name: 'ohos_id_color_foreground', raw: 'sys.color.ohos_id_color_foreground' }, location: { uri: 'file:///mock/sys/color.json', value: 'System Resource ID: 125829120' } },
  { reference: { scope: 'sys', type: ResourceType.String, name: 'ohos_id_text_font_family_regular', raw: 'sys.string.ohos_id_text_font_family_regular' }, location: { uri: 'file:///mock/sys/string.json', value: 'System Resource ID: 125829694' } },
  { reference: { scope: 'sys', type: ResourceType.Float, name: 'ohos_id_alpha_content_primary', raw: 'sys.float.ohos_id_alpha_content_primary' }, location: { uri: 'file:///mock/sys/float.json', value: 'System Resource ID: 125829369' } },
]

describe('资源补全匹配逻辑', () => {
  it('第一段前缀匹配: a -> app, s -> sys', () => {
    const context1 = { currentInput: 'a', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 'a' }
    const context2 = { currentInput: 's', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 's' }
    const r1 = generateResourceCompletionItems(context1, mockResources).map(i => i.label)
    const r2 = generateResourceCompletionItems(context2, mockResources).map(i => i.label)
    expect(r1).toContain('app')
    expect(r2).toContain('sys')
  })

  it('第二段类型匹配: app.c -> color', () => {
    const context = { currentInput: 'app.c', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 'app.c' }
    const r = generateResourceCompletionItems(context, mockResources).map(i => i.label)
    expect(r).toContain('color')
  })

  it('第三段资源匹配: app.color.p -> primary_color', () => {
    const context = { currentInput: 'app.color.p', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 'app.color.p' }
    const r = generateResourceCompletionItems(context, mockResources).map(i => i.label)
    expect(r).toContain('primary_color')
  })
})
