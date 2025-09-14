// LSP 定义跳转功能测试工具
// 模拟 LSP 客户端发送定义跳转请求

import { createConnection } from 'vscode-languageserver/node.js'
import { TextDocument } from 'vscode-languageserver-textdocument'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '../../..')

console.log('🔧 LSP 定义跳转功能测试工具')
console.log('项目根目录:', projectRoot)

// 测试用例：模拟在 Index.ets 文件中点击 $r() 调用
const testCases = [
  {
    file: 'sample/entry/src/main/ets/pages/Index.ets',
    line: 30, // Text($r("app.string.app_name"))
    character: 35, // 点击在 $r() 调用中间
    description: '测试字符串资源跳转'
  },
  {
    file: 'sample/entry/src/main/ets/pages/Index.ets',
    line: 31, // .fontColor($r('app.color.primary_color'))
    character: 25,
    description: '测试颜色资源跳转'
  }
]

async function testLSPDefinition() {
  console.log('\n=== 开始测试 LSP 定义跳转功能 ===')
  
  // 读取实际的 Index.ets 文件
  const indexFilePath = path.join(projectRoot, 'sample/entry/src/main/ets/pages/Index.ets')
  
  if (!fs.existsSync(indexFilePath)) {
    console.log('❌ 测试文件不存在:', indexFilePath)
    return
  }
  
  const content = fs.readFileSync(indexFilePath, 'utf-8')
  const lines = content.split('\n')
  
  console.log('\n📄 Index.ets 文件内容:')
  lines.forEach((line, index) => {
    if (line.includes('$r(')) {
      console.log(`  ${index + 1}: ${line.trim()}`)
    }
  })
  
  // 手动测试资源解析
  console.log('\n=== 手动测试资源解析 ===')
  
  // 导入我们的服务
  try {
    const { ResourceResolver, parseResourceReference } = await import('../out/index.mjs')
    
    const resolver = new ResourceResolver(projectRoot)
    await resolver.buildIndex()
    
    const allResources = resolver.getAllResources()
    console.log(`✅ 资源解析器初始化成功，找到 ${allResources.length} 个资源`)
    
    // 测试具体的资源引用
    const testResourceRefs = [
      'app.string.app_name',
      'app.color.primary_color',
      'app.color.start_window_background',
      'app.media.icon'
    ]
    
    for (const resourceRef of testResourceRefs) {
      try {
        const location = await resolver.resolveResourceReference(resourceRef)
        if (location) {
          console.log(`✅ ${resourceRef} -> ${path.basename(location.uri)} (值: ${location.value})`)
        } else {
          console.log(`❌ ${resourceRef} -> 未找到`)
        }
      } catch (error) {
        console.log(`❌ ${resourceRef} -> 错误: ${error.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ 导入资源解析器失败:', error)
  }
}

async function testResourceCallDetection() {
  console.log('\n=== 测试 $r() 调用检测 ===')
  
  const testLines = [
    'Text($r("app.string.app_name"))',
    '.fontColor($r(\'app.color.primary_color\'))',
    '.backgroundColor($r(`app.color.start_window_background`))',
    'Image($r("app.media.icon"))',
    'normal text without resource call'
  ]
  
  // 资源调用检测函数（从我们的服务中复制）
  function findResourceCallAtPosition(line, character) {
    const resourceCallRegex = /\$r\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
    
    let match
    while ((match = resourceCallRegex.exec(line)) !== null) {
      const fullCall = match[0]
      const resourceRef = match[1]
      const start = match.index
      const end = match.index + fullCall.length
      
      if (character >= start && character <= end) {
        return {
          resourceRef,
          start,
          end,
          fullCall,
        }
      }
    }
    
    return null
  }
  
  testLines.forEach((line, index) => {
    console.log(`\n测试行 ${index + 1}: ${line}`)
    
    // 找到 $r( 的位置并测试点击
    const dollarRIndex = line.indexOf('$r(')
    if (dollarRIndex !== -1) {
      const clickPosition = dollarRIndex + 10 // 点击在 $r() 调用中间
      const result = findResourceCallAtPosition(line, clickPosition)
      
      if (result) {
        console.log(`  ✅ 检测到资源调用: ${result.resourceRef}`)
        console.log(`  位置: ${result.start}-${result.end}`)
      } else {
        console.log(`  ❌ 未检测到资源调用`)
      }
    } else {
      console.log(`  ℹ️  无 $r() 调用`)
    }
  })
}

async function runAllTests() {
  try {
    await testResourceCallDetection()
    await testLSPDefinition()
    
    console.log('\n🎉 测试完成！')
    console.log('\n📋 下一步调试建议:')
    console.log('1. 检查 VS Code 中是否正确加载了语言服务器')
    console.log('2. 查看 VS Code 开发者工具的控制台日志')
    console.log('3. 确认 LSP 通信是否正常工作')
    console.log('4. 验证定义跳转功能是否被正确注册')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
runAllTests()