// 集成测试：测试与实际项目结构的集成
import { parseResourceReference, ResourceType, ResourceResolver } from '../out/index.mjs'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取项目根目录（向上三级目录）
const projectRoot = path.resolve(__dirname, '../../..')

console.log('开始集成测试...')
console.log('项目根目录:', projectRoot)

async function testWithRealProject() {
  console.log('\n=== 测试实际项目结构 ===')
  
  // 检查 sample 目录是否存在
  const sampleDir = path.join(projectRoot, 'sample')
  if (!fs.existsSync(sampleDir)) {
    console.log('❌ sample 目录不存在，跳过实际项目测试')
    return
  }
  
  const resolver = new ResourceResolver(projectRoot)
  console.log('正在构建资源索引...')
  
  try {
    await resolver.buildIndex()
    console.log('✅ 资源索引构建成功')
    
    // 获取所有资源
    const allResources = resolver.getAllResources()
    console.log(`📊 找到 ${allResources.length} 个资源`)
    
    if (allResources.length > 0) {
      console.log('\n资源列表:')
      allResources.forEach((resource, index) => {
        console.log(`  ${index + 1}. ${resource.reference.raw} -> ${resource.location.uri}`)
        if (resource.location.value) {
          console.log(`     值: ${resource.location.value}`)
        }
      })
    }
    
    // 测试一些具体的资源引用
    const testCases = [
      'app.color.start_window_background',
      'app.color.primary_color',
      'app.string.app_name',
      'app.string.welcome_message',
      'app.media.icon',
      'app.media.startIcon'
    ]
    
    console.log('\n=== 测试具体资源引用 ===')
    for (const testCase of testCases) {
      try {
        const result = await resolver.resolveResourceReference(testCase)
        if (result) {
          console.log(`✅ ${testCase} -> ${path.basename(result.uri)}`)
          if (result.value) {
            console.log(`   值: ${result.value}`)
          }
        } else {
          console.log(`⚠️  ${testCase} -> 未找到`)
        }
      } catch (error) {
        console.log(`❌ ${testCase} -> 错误: ${error.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ 资源索引构建失败:', error)
  }
}

async function testResourcePathBuilding() {
  console.log('\n=== 测试资源路径构建 ===')
  
  // 测试不同类型的资源路径
  const testCases = [
    { type: ResourceType.Color, expected: 'element/color.json' },
    { type: ResourceType.String, expected: 'element/string.json' },
    { type: ResourceType.Float, expected: 'element/float.json' },
    { type: ResourceType.Media, expected: 'media' }
  ]
  
  testCases.forEach(testCase => {
    // 注意：buildResourceFilePath 函数需要从模块中导入
    const expectedPath = path.join(projectRoot, 'entry', 'src', 'main', 'resources', 'base', testCase.expected)
    console.log(`${testCase.type} 资源路径: ${testCase.expected}`)
  })
}

async function testParsingEdgeCases() {
  console.log('\n=== 测试边界条件 ===')
  
  const edgeCases = [
    // 有效的引用
    { input: 'app.color.primary', shouldPass: true },
    { input: "'app.string.title'", shouldPass: true },
    { input: '"app.media.logo"', shouldPass: true },
    { input: '`app.float.size`', shouldPass: true },
    
    // 无效的引用
    { input: 'invalid', shouldPass: false },
    { input: 'app.invalid_type.name', shouldPass: false },
    { input: 'invalid_scope.color.name', shouldPass: false },
    { input: 'app.color', shouldPass: false },
    { input: '', shouldPass: false },
    { input: 'app..name', shouldPass: false },
    { input: '.color.name', shouldPass: false }
  ]
  
  edgeCases.forEach(testCase => {
    const result = parseResourceReference(testCase.input)
    const passed = testCase.shouldPass ? result !== null : result === null
    
    if (passed) {
      console.log(`✅ "${testCase.input}" -> ${testCase.shouldPass ? '有效' : '无效'}`)
    } else {
      console.log(`❌ "${testCase.input}" -> 预期${testCase.shouldPass ? '有效' : '无效'}，实际${result !== null ? '有效' : '无效'}`)
    }
  })
}

// 运行所有测试
async function runAllTests() {
  try {
    await testWithRealProject()
    await testResourcePathBuilding()
    await testParsingEdgeCases()
    
    console.log('\n🎉 集成测试完成！')
  } catch (error) {
    console.error('❌ 集成测试失败:', error)
  }
}

runAllTests()