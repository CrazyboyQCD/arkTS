#!/usr/bin/env node

/**
 * 测试资源诊断功能
 */

const { createResourceDiagnosticService } = require('@arkts/language-server')
const { ResourceResolver } = require('@arkts/shared')

async function testResourceDiagnostics() {
  console.log('=== 测试资源诊断功能 ===')

  const projectRoot = 'C:\\Users\\Administrator\\Desktop\\arkTS'

  // 创建模拟文档
  const testDocument = {
    uri: 'file:///test.ets',
    getText: () => `
@Entry
@Component  
struct TestPage {
  build() {
    Column() {
      Text('Hello')
        .fontColor($r('app.color.bg_color'))      // 存在的资源
        .backgroundColor($r('app.color.missing'))  // 不存在的资源
      
      Text($r('app.string.hello_world'))          // 存在的资源
        .margin($r('app.float.missing_margin'))   // 不存在的资源
      
      Text($r('invalid.format'))                  // 无效格式
    }
  }
}
    `.trim(),
  }

  try {
    // 测试不同诊断级别
    const diagnosticLevels = ['error', 'warning', 'none']

    for (const level of diagnosticLevels) {
      console.log(`\n--- 测试诊断级别: ${level} ---`)

      const service = createResourceDiagnosticService(
        projectRoot,
        () => level,
      )

      const plugin = service.create({})

      if (plugin.provideDiagnostics) {
        const diagnostics = await plugin.provideDiagnostics(testDocument)

        console.log(`找到 ${diagnostics.length} 个诊断:`)
        diagnostics.forEach((diag, index) => {
          console.log(`  ${index + 1}. [${diag.severity === 1 ? 'ERROR' : 'WARNING'}] ${diag.message}`)
          console.log(`     位置: 行${diag.range.start.line + 1}, 列${diag.range.start.character + 1}-${diag.range.end.character + 1}`)
          console.log(`     代码: ${diag.code}`)
        })
      }
    }
  }
  catch (error) {
    console.error('测试失败:', error)
  }
}

// 运行测试
if (require.main === module) {
  testResourceDiagnostics()
}
