const path = require('path')
const fs = require('fs')

console.log('=== 测试改进的精确跳转功能 ===')

// 改进的资源定位函数
function findSysResourceItemRange(lines, resourceName, resourceType) {
  let inResourceTypeSection = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 检查是否进入了对应的资源类型段落
    if (line.includes(`${resourceType}:`)) {
      inResourceTypeSection = true
      continue
    }
    
    // 如果在资源类型段落中
    if (inResourceTypeSection) {
      // 检查是否离开了当前段落（到了下一个类型或结束）
      if (line.includes('}') && !line.includes(resourceName)) {
        // 检查是否是结束大括号，且不包含目标资源
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
        if (nextLine === '' || nextLine.includes(':') || nextLine === '}') {
          inResourceTypeSection = false
          continue
        }
      }
      
      // 在当前段落中查找具体的资源名称
      if (line.includes(resourceName)) {
        const originalLine = lines[i] // 保持原始的空格
        const start = originalLine.indexOf(resourceName)
        if (start >= 0) {
          return {
            start: { line: i, character: start },
            end: { line: i, character: start + resourceName.length },
          }
        }
      }
    }
  }
  
  return undefined
}

async function runDetailedTest() {
  try {
    const projectRoot = process.cwd()
    const sdkPath = path.join(process.cwd(), 'mock-sdk')
    const sysResourcePath = path.join(sdkPath, 'ets', 'build-tools', 'ets-loader', 'sysResource.js')
    
    console.log('项目根路径:', projectRoot)
    console.log('SDK路径:', sdkPath)
    console.log('资源文件路径:', sysResourcePath)
    
    if (!fs.existsSync(sysResourcePath)) {
      console.log('❌ sys资源文件不存在:', sysResourcePath)
      return
    }
    
    const content = fs.readFileSync(sysResourcePath, 'utf-8')
    const lines = content.split('\n')
    
    console.log('\n✅ 成功读取sys资源文件')
    console.log('文件行数:', lines.length)
    
    // 打印文件内容以便调试
    console.log('\n📄 文件内容预览:')
    lines.forEach((line, index) => {
      console.log(`${index + 1}: \"${line}\"`)
    })
    
    console.log('\n🔍 开始测试精确定位...')
    
    // 测试精确定位
    const testCases = [
      { name: 'ohos_id_color_foreground', type: 'color' },
      { name: 'ohos_id_alpha_content_primary', type: 'float' },
      { name: 'ohos_id_text_font_family_regular', type: 'string' },
      { name: 'ohos_app_icon', type: 'media' },
      { name: 'ohos_wifi', type: 'symbol' },
      { name: 'selecttitlebar_accessibility_message_desc_new', type: 'plural' }
    ]
    
    for (const testCase of testCases) {
      const range = findSysResourceItemRange(lines, testCase.name, testCase.type)
      if (range) {
        console.log(`✅ ${testCase.type}.${testCase.name}:`)
        console.log(`   → 定位成功: 行${range.start.line + 1}, 列${range.start.character + 1}-${range.end.character + 1}`)
        console.log(`   → 所在行: \"${lines[range.start.line]}\"`)
      } else {
        console.log(`❌ ${testCase.type}.${testCase.name}: 定位失败`)
      }
    }
    
    console.log('\n=== 改进的精确跳转功能测试完成 ===')
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

runDetailedTest()