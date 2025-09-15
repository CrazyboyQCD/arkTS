import { describe, expect, it } from 'vitest'

// 扩展数据集，覆盖更多 case
const mockResources = [
  { reference: { scope: 'app', type: 'color', name: 'primary_color', raw: 'app.color.primary_color' }, location: { value: '#ff0000' } },
  { reference: { scope: 'app', type: 'color', name: 'bg_color', raw: 'app.color.bg_color' }, location: { value: '#ffffff' } },
  { reference: { scope: 'app', type: 'color', name: 'border_color', raw: 'app.color.border_color' }, location: { value: '#cccccc' } },
  { reference: { scope: 'app', type: 'string', name: 'title', raw: 'app.string.title' }, location: { value: 'Welcome' } },
  { reference: { scope: 'app', type: 'string', name: 'subtitle', raw: 'app.string.subtitle' }, location: { value: 'Hello World' } },
  { reference: { scope: 'app', type: 'float', name: 'padding', raw: 'app.float.padding' }, location: { value: '16.0' } },
  { reference: { scope: 'sys', type: 'color', name: 'ohos_id_color_foreground', raw: 'sys.color.ohos_id_color_foreground' }, location: { value: 'System Resource ID: 125829120' } },
  { reference: { scope: 'sys', type: 'color', name: 'ohos_id_color_background', raw: 'sys.color.ohos_id_color_background' }, location: { value: 'System Resource ID: 125829121' } },
  { reference: { scope: 'sys', type: 'string', name: 'ohos_id_text_font_family_regular', raw: 'sys.string.ohos_id_text_font_family_regular' }, location: { value: 'System Resource ID: 125829694' } },
  { reference: { scope: 'sys', type: 'string', name: 'ohos_id_cancel', raw: 'sys.string.ohos_id_cancel' }, location: { value: 'System Resource ID: 125829697' } },
  { reference: { scope: 'sys', type: 'float', name: 'ohos_id_alpha_content_primary', raw: 'sys.float.ohos_id_alpha_content_primary' }, location: { value: 'System Resource ID: 125829369' } },
  { reference: { scope: 'sys', type: 'media', name: 'ohos_app_icon', raw: 'sys.media.ohos_app_icon' }, location: { value: 'System Resource ID: 125829858' } },
  { reference: { scope: 'sys', type: 'symbol', name: 'ohos_wifi', raw: 'sys.symbol.ohos_wifi' }, location: { value: 'System Resource ID: 125830644' } },
]

function generateResourceCompletionItems(prefix: string, resources: typeof mockResources) {
  const items: Array<{ label: string, insertText: string, detail: string, filterText?: string }> = []

  if (!prefix) {
    items.push({ label: 'app', insertText: 'app.', detail: '应用资源' })
    items.push({ label: 'sys', insertText: 'sys.', detail: '系统资源' })
    return items
  }

  const parts = prefix.split('.')

  if (parts.length === 1) {
    const scopePrefix = parts[0].toLowerCase()
    if ('app'.startsWith(scopePrefix))
      items.push({ label: 'app', insertText: scopePrefix === 'app' ? '.' : 'app.', detail: '应用资源', filterText: 'app' })
    if ('sys'.startsWith(scopePrefix))
      items.push({ label: 'sys', insertText: scopePrefix === 'sys' ? '.' : 'sys.', detail: '系统资源', filterText: 'sys' })

    const scope = parts[0]
    if (scope === 'app' || scope === 'sys') {
      const types = new Set<string>()
      resources.filter(r => r.reference.scope === scope).forEach(r => types.add(r.reference.type))
      Array.from(types).forEach(type => items.push({ label: type, insertText: `${type}.`, detail: `${scope === 'app' ? '应用' : '系统'}${type}资源`, filterText: type }))
    }
    return items
  }

  if (parts.length === 2) {
    const [scope, typePrefix] = parts
    if (scope === 'app' || scope === 'sys') {
      const types = new Set<string>()
      resources.filter(r => r.reference.scope === scope).forEach(r => types.add(r.reference.type))
      Array.from(types).filter(type => type.toLowerCase().startsWith(typePrefix.toLowerCase())).forEach(type => items.push({ label: type, insertText: typePrefix === type ? '.' : `${type.substring(typePrefix.length)}.`, detail: `${scope === 'app' ? '应用' : '系统'}${type}资源`, filterText: type }))

      const filteredResources = resources.filter(r => r.reference.scope === scope && r.reference.type === typePrefix)
      filteredResources.forEach(resource => items.push({ label: resource.reference.name, insertText: resource.reference.name, detail: resource.location.value || `${scope}.${typePrefix} 资源`, filterText: resource.reference.name }))
    }
    return items
  }

  if (parts.length === 3) {
    const [scope, type, namePrefix] = parts
    const filteredResources = resources.filter(r => r.reference.scope === scope && r.reference.type === type && r.reference.name.toLowerCase().startsWith(namePrefix.toLowerCase()))
    filteredResources.forEach(resource => items.push({ label: resource.reference.name, insertText: namePrefix === resource.reference.name ? '' : resource.reference.name.substring(namePrefix.length), detail: resource.location.value || `${scope}.${type} 资源`, filterText: resource.reference.name }))
    return items
  }

  return items
}

describe('补全匹配修复验证', () => {
  it('第一段前缀: a -> app, s -> sys, ap -> app, sy -> sys', () => {
    expect(generateResourceCompletionItems('a', mockResources).map(i => i.label)).toContain('app')
    expect(generateResourceCompletionItems('s', mockResources).map(i => i.label)).toContain('sys')
    expect(generateResourceCompletionItems('ap', mockResources).map(i => i.label)).toContain('app')
    expect(generateResourceCompletionItems('sy', mockResources).map(i => i.label)).toContain('sys')
  })

  it('第二段类型: app.c -> color, sys.s -> string/symbol', () => {
    const a = generateResourceCompletionItems('app.c', mockResources).map(i => i.label)
    const b = generateResourceCompletionItems('sys.s', mockResources).map(i => i.label)
    expect(a).toContain('color')
    expect(b).toContain('string')
    expect(b).toContain('symbol')
  })

  it('第三段名称: app.color.p -> primary_color, app.color.b -> bg_color/border_color', () => {
    const p = generateResourceCompletionItems('app.color.p', mockResources).map(i => i.label)
    const b = generateResourceCompletionItems('app.color.b', mockResources).map(i => i.label)
    expect(p).toContain('primary_color')
    expect(b).toContain('bg_color')
    expect(b).toContain('border_color')
  })

  it('第三段名称: sys.string.ohos* 命中', () => {
    const r = generateResourceCompletionItems('sys.string.ohos', mockResources).map(i => i.label)
    expect(r.some(name => name.startsWith('ohos_'))).toBe(true)
  })
})
