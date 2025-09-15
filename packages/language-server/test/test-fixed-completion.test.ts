import type { ResourceIndexItem } from '@arkts/shared'
import { describe, expect, it } from 'vitest'
import { generateResourceCompletionItems } from '../src/services/resource-completion.service'
import { ResourceType } from '../../shared/src/resource-resolver'

// 扩展数据集，覆盖更多 case
const mockResources: ResourceIndexItem[] = [
  { reference: { scope: 'app', type: ResourceType.Color, name: 'primary_color', raw: 'app.color.primary_color' }, location: { uri: 'file:///mock/app/color.json', value: '#ff0000' } },
  { reference: { scope: 'app', type: ResourceType.Color, name: 'bg_color', raw: 'app.color.bg_color' }, location: { uri: 'file:///mock/app/color.json', value: '#ffffff' } },
  { reference: { scope: 'app', type: ResourceType.Color, name: 'border_color', raw: 'app.color.border_color' }, location: { uri: 'file:///mock/app/color.json', value: '#cccccc' } },
  { reference: { scope: 'app', type: ResourceType.String, name: 'title', raw: 'app.string.title' }, location: { uri: 'file:///mock/app/string.json', value: 'Welcome' } },
  { reference: { scope: 'app', type: ResourceType.String, name: 'subtitle', raw: 'app.string.subtitle' }, location: { uri: 'file:///mock/app/string.json', value: 'Hello World' } },
  { reference: { scope: 'app', type: ResourceType.Float, name: 'padding', raw: 'app.float.padding' }, location: { uri: 'file:///mock/app/float.json', value: '16.0' } },
  { reference: { scope: 'sys', type: ResourceType.Color, name: 'ohos_id_color_foreground', raw: 'sys.color.ohos_id_color_foreground' }, location: { uri: 'file:///mock/sys/color.json', value: 'System Resource ID: 125829120' } },
  { reference: { scope: 'sys', type: ResourceType.Color, name: 'ohos_id_color_background', raw: 'sys.color.ohos_id_color_background' }, location: { uri: 'file:///mock/sys/color.json', value: 'System Resource ID: 125829121' } },
  { reference: { scope: 'sys', type: ResourceType.String, name: 'ohos_id_text_font_family_regular', raw: 'sys.string.ohos_id_text_font_family_regular' }, location: { uri: 'file:///mock/sys/string.json', value: 'System Resource ID: 125829694' } },
  { reference: { scope: 'sys', type: ResourceType.String, name: 'ohos_id_cancel', raw: 'sys.string.ohos_id_cancel' }, location: { uri: 'file:///mock/sys/string.json', value: 'System Resource ID: 125829697' } },
  { reference: { scope: 'sys', type: ResourceType.Float, name: 'ohos_id_alpha_content_primary', raw: 'sys.float.ohos_id_alpha_content_primary' }, location: { uri: 'file:///mock/sys/float.json', value: 'System Resource ID: 125829369' } },
  { reference: { scope: 'sys', type: ResourceType.Media, name: 'ohos_app_icon', raw: 'sys.media.ohos_app_icon' }, location: { uri: 'file:///mock/sys/media.json', value: 'System Resource ID: 125829858' } },
  { reference: { scope: 'sys', type: ResourceType.Symbol, name: 'ohos_wifi', raw: 'sys.symbol.ohos_wifi' }, location: { uri: 'file:///mock/sys/symbol.json', value: 'System Resource ID: 125830644' } },
]

describe('补全匹配修复验证', () => {
  it('第一段前缀: a -> app, s -> sys, ap -> app, sy -> sys', () => {
    const context1 = { currentInput: 'a', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 'a' }
    const context2 = { currentInput: 's', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 's' }
    const context3 = { currentInput: 'ap', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 'ap' }
    const context4 = { currentInput: 'sy', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 'sy' }

    expect(generateResourceCompletionItems(context1, mockResources).map(i => i.label)).toContain('app')
    expect(generateResourceCompletionItems(context2, mockResources).map(i => i.label)).toContain('sys')
    expect(generateResourceCompletionItems(context3, mockResources).map(i => i.label)).toContain('app')
    expect(generateResourceCompletionItems(context4, mockResources).map(i => i.label)).toContain('sys')
  })

  it('第二段类型: app.c -> color, sys.s -> string/symbol', () => {
    const context1 = { currentInput: 'app.c', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 'app.c' }
    const context2 = { currentInput: 'sys.s', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 'sys.s' }

    const a = generateResourceCompletionItems(context1, mockResources).map(i => i.label)
    const b = generateResourceCompletionItems(context2, mockResources).map(i => i.label)
    expect(a).toContain('color')
    expect(b).toContain('string')
    expect(b).toContain('symbol')
  })

  it('第三段名称: app.color.p -> primary_color, app.color.b -> bg_color/border_color', () => {
    const context1 = { currentInput: 'app.color.p', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 'app.color.p' }
    const context2 = { currentInput: 'app.color.b', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 'app.color.b' }

    const p = generateResourceCompletionItems(context1, mockResources).map(i => i.label)
    const b = generateResourceCompletionItems(context2, mockResources).map(i => i.label)
    expect(p).toContain('primary_color')
    expect(b).toContain('bg_color')
    expect(b).toContain('border_color')
  })

  it('第三段名称: sys.string.ohos* 命中', () => {
    const context = { currentInput: 'sys.string.ohos', startPosition: { line: 0, character: 0 }, isInResourceCall: true, prefix: 'sys.string.ohos' }
    const r = generateResourceCompletionItems(context, mockResources).map(i => i.label)
    expect(r.some(name => name.startsWith('ohos_'))).toBe(true)
  })
})
