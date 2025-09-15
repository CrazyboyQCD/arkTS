import { describe, expect, it } from 'vitest'

// 与旧脚本保持一致的模拟数据与逻辑，仅用于单元测试，非 src 代码
const mockResources = [
  { reference: { scope: 'app', type: 'color', name: 'primary_color', raw: 'app.color.primary_color' }, location: { value: '#ff0000' } },
  { reference: { scope: 'app', type: 'color', name: 'bg_color', raw: 'app.color.bg_color' }, location: { value: '#ffffff' } },
  { reference: { scope: 'app', type: 'string', name: 'title', raw: 'app.string.title' }, location: { value: 'Welcome' } },
  { reference: { scope: 'sys', type: 'color', name: 'ohos_id_color_foreground', raw: 'sys.color.ohos_id_color_foreground' }, location: { value: 'System Resource ID: 125829120' } },
  { reference: { scope: 'sys', type: 'string', name: 'ohos_id_text_font_family_regular', raw: 'sys.string.ohos_id_text_font_family_regular' }, location: { value: 'System Resource ID: 125829694' } },
  { reference: { scope: 'sys', type: 'float', name: 'ohos_id_alpha_content_primary', raw: 'sys.float.ohos_id_alpha_content_primary' }, location: { value: 'System Resource ID: 125829369' } },
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

    if ('app'.startsWith(scopePrefix)) {
      items.push({ label: 'app', insertText: scopePrefix === 'app' ? '.' : 'app.', detail: '应用资源', filterText: 'app' })
    }
    if ('sys'.startsWith(scopePrefix)) {
      items.push({ label: 'sys', insertText: scopePrefix === 'sys' ? '.' : 'sys.', detail: '系统资源', filterText: 'sys' })
    }

    const scope = parts[0]
    if (scope === 'app' || scope === 'sys') {
      const types = new Set<string>()
      resources.filter(r => r.reference.scope === scope).forEach(r => types.add(r.reference.type))
      Array.from(types).forEach((type) => {
        items.push({ label: type, insertText: `${type}.`, detail: `${scope === 'app' ? '应用' : '系统'}${type}资源`, filterText: type })
      })
    }
    return items
  }

  if (parts.length === 2) {
    const [scope, typePrefix] = parts
    if (scope === 'app' || scope === 'sys') {
      const types = new Set<string>()
      resources.filter(r => r.reference.scope === scope).forEach(r => types.add(r.reference.type))
      Array.from(types)
        .filter(type => type.toLowerCase().startsWith(typePrefix.toLowerCase()))
        .forEach((type) => {
          items.push({ label: type, insertText: typePrefix === type ? '.' : `${type.substring(typePrefix.length)}.`, detail: `${scope === 'app' ? '应用' : '系统'}${type}资源`, filterText: type })
        })

      const filteredResources = resources.filter(r => r.reference.scope === scope && r.reference.type === typePrefix)
      filteredResources.forEach((resource) => {
        items.push({ label: resource.reference.name, insertText: resource.reference.name, detail: resource.location.value || `${scope}.${typePrefix} 资源`, filterText: resource.reference.name })
      })
    }
    return items
  }

  if (parts.length === 3) {
    const [scope, type, namePrefix] = parts
    const filteredResources = resources.filter(r => r.reference.scope === scope && r.reference.type === type && r.reference.name.toLowerCase().startsWith(namePrefix.toLowerCase()))
    filteredResources.forEach((resource) => {
      items.push({ label: resource.reference.name, insertText: namePrefix === resource.reference.name ? '' : resource.reference.name.substring(namePrefix.length), detail: resource.location.value || `${scope}.${type} 资源`, filterText: resource.reference.name })
    })
    return items
  }

  return items
}

describe('资源补全匹配逻辑', () => {
  it('第一段前缀匹配: a -> app, s -> sys', () => {
    const r1 = generateResourceCompletionItems('a', mockResources).map(i => i.label)
    const r2 = generateResourceCompletionItems('s', mockResources).map(i => i.label)
    expect(r1).toContain('app')
    expect(r2).toContain('sys')
  })

  it('第二段类型匹配: app.c -> color', () => {
    const r = generateResourceCompletionItems('app.c', mockResources).map(i => i.label)
    expect(r).toContain('color')
  })

  it('第三段资源匹配: app.color.p -> primary_color', () => {
    const r = generateResourceCompletionItems('app.color.p', mockResources).map(i => i.label)
    expect(r).toContain('primary_color')
  })
})
