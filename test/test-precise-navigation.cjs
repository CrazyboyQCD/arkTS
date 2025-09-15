const path = require('node:path')
const { ResourceResolver } = require('../packages/shared/src/resource-resolver.ts')

console.log('=== 测试精确跳转功能 ===')

async function testPreciseNavigation() {
  try {
    const projectRoot = process.cwd()
    const sdkPath = path.join(process.cwd(), 'mock-sdk')

    console.log('项目根路径:', projectRoot)
    console.log('SDK路径:', sdkPath)

    const resolver = new ResourceResolver(projectRoot, sdkPath)
    await resolver.buildIndex()

    console.log('\n=== 测试系统资源精确定位 ===')

    // 测试系统资源的精确定位
    const sysTests = [
      'sys.color.ohos_id_color_foreground',
      'sys.float.ohos_id_alpha_content_primary',
      'sys.string.ohos_id_text_font_family_regular',
      'sys.media.ohos_app_icon',
      'sys.symbol.ohos_wifi',
      'sys.plural.selecttitlebar_accessibility_message_desc_new',
    ]

    for (const testRef of sysTests) {
      const location = await resolver.resolveResourceReference(testRef)
      if (location && location.range) {
        console.log(`✅ ${testRef}:`)
        console.log(`   → 位置: 行${location.range.start.line + 1}, 列${location.range.start.character + 1}-${location.range.end.character + 1}`)
        console.log(`   → 值: ${location.value}`)
      }
      else {
        console.log(`❌ ${testRef}: 无法定位到精确位置`)
      }
    }

    console.log('\n=== 测试应用资源精确定位 ===')

    // 测试应用资源的精确定位
    const appTests = [
      'app.color.bg_color',
      'app.string.title',
      'app.media.logo',
    ]

    for (const testRef of appTests) {
      const location = await resolver.resolveResourceReference(testRef)
      if (location && location.range) {
        console.log(`✅ ${testRef}:`)
        console.log(`   → 位置: 行${location.range.start.line + 1}, 列${location.range.start.character + 1}-${location.range.end.character + 1}`)
        console.log(`   → 值: ${location.value}`)
      }
      else {
        console.log(`❌ ${testRef}: 无法定位到精确位置`)
      }
    }

    console.log('\n=== 测试资源搜索功能 ===')

    // 测试资源搜索
    const searchResults = resolver.searchResources('color')
    console.log(`关键字 "color" 搜索结果 (${searchResults.length} 个):`)
    searchResults.slice(0, 5).forEach((item) => {
      console.log(`  - ${item.reference.raw}: ${item.location.value}`)
    })

    // 测试类型筛选
    const colorResources = resolver.getResourcesByType(undefined, 'color')
    console.log(`\n所有 color 类型资源 (${colorResources.length} 个):`)
    colorResources.slice(0, 5).forEach((item) => {
      console.log(`  - ${item.reference.raw}: ${item.location.value}`)
    })

    console.log('\n✅ 精确跳转功能测试完成！')
  }
  catch (error) {
    console.error('测试失败:', error)
  }
}

testPreciseNavigation()
