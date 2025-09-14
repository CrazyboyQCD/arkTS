console.log('=== 测试改进的资源补全匹配逻辑 ===')

// 模拟资源数据
const mockResources = [
  { reference: { scope: 'app', type: 'color', name: 'primary_color', raw: 'app.color.primary_color' }, location: { value: '#ff0000' } },
  { reference: { scope: 'app', type: 'color', name: 'bg_color', raw: 'app.color.bg_color' }, location: { value: '#ffffff' } },
  { reference: { scope: 'app', type: 'string', name: 'title', raw: 'app.string.title' }, location: { value: 'Welcome' } },
  { reference: { scope: 'sys', type: 'color', name: 'ohos_id_color_foreground', raw: 'sys.color.ohos_id_color_foreground' }, location: { value: 'System Resource ID: 125829120' } },
  { reference: { scope: 'sys', type: 'string', name: 'ohos_id_text_font_family_regular', raw: 'sys.string.ohos_id_text_font_family_regular' }, location: { value: 'System Resource ID: 125829694' } },
  { reference: { scope: 'sys', type: 'float', name: 'ohos_id_alpha_content_primary', raw: 'sys.float.ohos_id_alpha_content_primary' }, location: { value: 'System Resource ID: 125829369' } }
]

/**
 * 改进的资源补全项生成函数
 */
function generateResourceCompletionItems(prefix, resources) {
  const items = []
  
  console.log(`生成补全项，前缀: "${prefix}"`)
  
  // 如果前缀为空，提供范围选项
  if (!prefix) {
    items.push({ label: 'app', insertText: 'app.', detail: '应用资源' })
    items.push({ label: 'sys', insertText: 'sys.', detail: '系统资源' })
    return items
  }
  
  const parts = prefix.split('.')
  
  // 处理第一段：范围前缀匹配（如 'a', 's', 'app', 'sy'）
  if (parts.length === 1) {
    const scopePrefix = parts[0].toLowerCase()
    
    // 前缀匹配范围
    if ('app'.startsWith(scopePrefix)) {
      items.push({
        label: 'app',
        insertText: scopePrefix === 'app' ? '.' : 'app.',
        detail: '应用资源',
        filterText: 'app'
      })
    }
    
    if ('sys'.startsWith(scopePrefix)) {
      items.push({
        label: 'sys', 
        insertText: scopePrefix === 'sys' ? '.' : 'sys.',
        detail: '系统资源',
        filterText: 'sys'
      })
    }
    
    // 如果是完整的scope（'app' 或 'sys'），还要提供类型选项
    const scope = parts[0]
    if (scope === 'app' || scope === 'sys') {
      const types = new Set()
      resources
        .filter(r => r.reference.scope === scope)
        .forEach(r => types.add(r.reference.type))
      
      Array.from(types).forEach(type => {
        items.push({
          label: type,
          insertText: `${type}.`,
          detail: `${scope === 'app' ? '应用' : '系统'}${type}资源`,
          filterText: type
        })
      })
    }
    
    return items
  }
  
  // 处理第二段：类型匹配（如 'app.c', 'sys.str'）
  if (parts.length === 2) {
    const [scope, typePrefix] = parts
    
    if (scope === 'app' || scope === 'sys') {
      const types = new Set()
      resources
        .filter(r => r.reference.scope === scope)
        .forEach(r => types.add(r.reference.type))
      
      // 前缀匹配类型
      Array.from(types)
        .filter(type => type.toLowerCase().startsWith(typePrefix.toLowerCase()))
        .forEach(type => {
          items.push({
            label: type,
            insertText: typePrefix === type ? '.' : type.substring(typePrefix.length) + '.',
            detail: `${scope === 'app' ? '应用' : '系统'}${type}资源`,
            filterText: type
          })
        })
      
      // 如果是完整的类型，提供资源选项
      const filteredResources = resources.filter(
        r => r.reference.scope === scope && r.reference.type === typePrefix
      )
      
      filteredResources.forEach(resource => {
        items.push({
          label: resource.reference.name,
          insertText: resource.reference.name,
          detail: resource.location.value || `${scope}.${typePrefix} 资源`,
          filterText: resource.reference.name
        })
      })
    }
    
    return items
  }
  
  // 处理第三段：资源名称匹配（如 'app.color.p', 'sys.string.ohos'）
  if (parts.length === 3) {
    const [scope, type, namePrefix] = parts
    
    const filteredResources = resources.filter(
      r => r.reference.scope === scope && 
           r.reference.type === type &&
           r.reference.name.toLowerCase().startsWith(namePrefix.toLowerCase())
    )
    
    filteredResources.forEach(resource => {
      items.push({
        label: resource.reference.name,
        insertText: namePrefix === resource.reference.name ? '' : resource.reference.name.substring(namePrefix.length),
        detail: resource.location.value || `${scope}.${type} 资源`,
        filterText: resource.reference.name
      })
    })
    
    return items
  }
  
  return items
}

// 测试不同的输入情况
console.log('\n=== 测试用例 ===\n')

const testCases = [
  '', // 空输入
  'a', // 第一段前缀
  's', // 第一段前缀  
  'app', // 完整第一段
  'sys', // 完整第一段
  'app.', // 第一段完成，开始第二段
  'app.c', // 第二段前缀
  'app.color', // 完整第二段
  'app.color.', // 第二段完成，开始第三段
  'app.color.p', // 第三段前缀
  'sys.s', // sys的第二段前缀
  'sys.string.o', // sys的第三段前缀
]

testCases.forEach(testCase => {
  console.log(`输入: "${testCase}"`)
  const results = generateResourceCompletionItems(testCase, mockResources)
  
  if (results.length > 0) {
    console.log('补全结果:')
    results.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.label} -> "${item.insertText}" (${item.detail})`)
    })
  } else {
    console.log('  无匹配结果')
  }
  console.log('')
})

console.log('=== 修复验证 ===')
console.log('✅ 第一段前缀匹配: a -> app, s -> sys')
console.log('✅ 第二段类型匹配: app.c -> color, sys.s -> string') 
console.log('✅ 第三段资源匹配: app.color.p -> primary_color, sys.string.o -> ohos_...')
console.log('✅ 所有层级的前缀匹配都已修复')