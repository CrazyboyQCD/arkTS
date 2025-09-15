const fs = require('node:fs')
const path = require('node:path')

console.log('=== 测试精确跳转功能 ===')

// 模拟创建资源解析器类
class TestResourceResolver {
  constructor(projectRoot, sdkPath) {
    this.projectRoot = projectRoot
    this.sdkPath = sdkPath
    this.resourceIndex = new Map()
  }

  // 模拟系统资源定位功能
  findSysResourceItemRange(lines, resourceName, resourceType) {
    let inResourceTypeSection = false
    let braceCount = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // 检查是否进入了对应的资源类型段落
      if (line.includes(`${resourceType}:`)) {
        inResourceTypeSection = true
        braceCount = 0
        continue
      }

      if (inResourceTypeSection) {
        // 统计大括号数量来确定段落范围
        const openBraces = (line.match(/\\\{/g) || []).length
        const closeBraces = (line.match(/\\\}/g) || []).length
        braceCount += openBraces - closeBraces

        // 查找具体的资源名称
        const resourceMatch = line.match(new RegExp(`\\\\s*(${resourceName})\\\\s*:\\\\s*`))
        if (resourceMatch) {
          const start = line.indexOf(resourceName)
          return {
            start: { line: i, character: start },
            end: { line: i, character: start + resourceName.length },
          }
        }

        // 如果大括号平衡且为负数，说明离开了当前段落
        if (braceCount < 0) {
          inResourceTypeSection = false
        }
      }
    }

    return undefined
  }

  // 模拟测试
  async testSysResourceParsing() {
    const sysResourcePath = path.join(this.sdkPath, 'ets', 'build-tools', 'ets-loader', 'sysResource.js')

    if (!fs.existsSync(sysResourcePath)) {
      console.log('❌ sys资源文件不存在:', sysResourcePath)
      return
    }

    const content = fs.readFileSync(sysResourcePath, 'utf-8')
    const lines = content.split('\n')

    console.log('✅ 成功读取sys资源文件')
    console.log('文件行数:', lines.length)

    // 测试精确定位
    const testCases = [
      { name: 'ohos_id_color_foreground', type: 'color' },
      { name: 'ohos_id_alpha_content_primary', type: 'float' },
      { name: 'ohos_id_text_font_family_regular', type: 'string' },
      { name: 'ohos_app_icon', type: 'media' },
      { name: 'ohos_wifi', type: 'symbol' },
      { name: 'selecttitlebar_accessibility_message_desc_new', type: 'plural' },
    ]

    for (const testCase of testCases) {
      const range = this.findSysResourceItemRange(lines, testCase.name, testCase.type)
      if (range) {
        console.log(`✅ ${testCase.type}.${testCase.name}:`)
        console.log(`   → 定位成功: 行${range.start.line + 1}, 列${range.start.character + 1}-${range.end.character + 1}`)
      }
      else {
        console.log(`❌ ${testCase.type}.${testCase.name}: 定位失败`)
      }
    }
  }
}

async function runTest() {
  try {
    const projectRoot = process.cwd()
    const sdkPath = path.join(process.cwd(), 'mock-sdk')

    console.log('项目根路径:', projectRoot)
    console.log('SDK路径:', sdkPath)

    const testResolver = new TestResourceResolver(projectRoot, sdkPath)
    await testResolver.testSysResourceParsing()

    console.log('\n=== 精确跳转功能测试完成 ===')
  }
  catch (error) {
    console.error('测试失败:', error)
  }
}

runTest()
