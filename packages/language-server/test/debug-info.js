console.log('================================')
console.log('🔍 ArkTS Resource Definition Service - Debug Information')
console.log('================================')

// 获取当前时间戳
const timestamp = new Date().toISOString()
console.log(`Timestamp: ${timestamp}`)

// 检查是否正确导入服务
try {
  const { createIntegratedResourceDefinitionService } = require('../src/services/integrated-resource-definition.service')
  console.log('✅ Service imported successfully')
  
  // 测试创建服务
  const testService = createIntegratedResourceDefinitionService('C:\\Users\\Administrator\\Desktop\\arkTS\\test')
  console.log('✅ Service created successfully')
  console.log('Service name:', testService.name)
  console.log('Service capabilities:', testService.capabilities)
  
} catch (error) {
  console.error('❌ Failed to import/create service:', error.message)
}

console.log('================================')
console.log('📋 下一步调试步骤:')
console.log('1. 在 VS Code 中打开 test/Index.ets 文件')
console.log('2. 按 Ctrl+Shift+P 打开命令面板')
console.log('3. 搜索 "Developer: Reload Window" 重新加载扩展')
console.log('4. 按 F12 打开开发者工具')
console.log('5. 在 Console 标签页中查找 [ARKTS-RESOURCE] 前缀的日志')
console.log('6. 将光标放在 $r() 调用上，按 F12 或 Ctrl+鼠标左键测试跳转')
console.log('7. 如果有错误信息，请复制完整的错误日志')
console.log('================================')