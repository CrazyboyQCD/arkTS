// 调试 LSP 定义跳转功能
// 检查服务注册、能力声明等关键环节

console.log('🔍 LSP 定义跳转功能调试工具')

// 1. 检查服务的能力声明
function checkServiceCapabilities() {
  console.log('\n=== 检查服务能力声明 ===')
  
  // 模拟我们的服务声明
  const services = [
    {
      name: 'arkts-resource-definition-integrated',
      capabilities: { definitionProvider: true },
      description: '集成资源定义跳转服务'
    },
    {
      name: 'ets-navigation-tree', 
      capabilities: { documentSymbolProvider: true },
      description: 'ETS 文档符号服务'
    },
    {
      name: 'typescript-semantic',
      capabilities: { definitionProvider: true, hoverProvider: true },
      description: 'TypeScript 语义服务'
    }
  ]
  
  services.forEach(service => {
    console.log(`📋 ${service.name}:`)
    console.log(`   能力: ${JSON.stringify(service.capabilities)}`)
    console.log(`   描述: ${service.description}`)
    
    if (service.capabilities.definitionProvider) {
      console.log(`   ✅ 支持定义跳转`)
    } else {
      console.log(`   ❌ 不支持定义跳转`)
    }
  })
}

// 2. 检查文档选择器
function checkDocumentSelector() {
  console.log('\n=== 检查文档选择器 ===')
  
  const documentSelector = [
    { language: 'ets' },
    { language: 'typescript' }
  ]
  
  console.log('当前文档选择器:')
  documentSelector.forEach((selector, index) => {
    console.log(`  ${index + 1}. ${JSON.stringify(selector)}`)
  })
  
  console.log('\n测试文件匹配:')
  const testFiles = [
    { file: 'Index.ets', language: 'ets', shouldMatch: true },
    { file: 'Component.ts', language: 'typescript', shouldMatch: true },
    { file: 'style.css', language: 'css', shouldMatch: false },
    { file: 'config.json', language: 'json', shouldMatch: false }
  ]
  
  testFiles.forEach(test => {
    const matches = documentSelector.some(selector => selector.language === test.language)
    const status = matches === test.shouldMatch ? '✅' : '❌'
    console.log(`  ${status} ${test.file} (${test.language}) -> ${matches ? '匹配' : '不匹配'}`)
  })
}

// 3. 检查服务加载顺序
function checkServiceLoadOrder() {
  console.log('\n=== 检查服务加载顺序 ===')
  
  const serviceOrder = [
    'typescript-semantic (TypeScript 语义服务)',
    'typescript-syntactic (TypeScript 语法服务)', 
    'typescript-other (其他 TypeScript 服务)',
    'ets-linter-diagnostic (ETS 诊断服务)',
    'ets-navigation-tree (ETS 符号服务)',
    '$$this-service ($$this 修复服务)',
    'arkts-resource-definition-integrated (资源定义跳转服务)'
  ]
  
  console.log('当前服务加载顺序:')
  serviceOrder.forEach((service, index) => {
    console.log(`  ${index + 1}. ${service}`)
  })
  
  console.log('\n⚠️  注意事项:')
  console.log('- TypeScript 服务通常优先处理定义跳转请求')
  console.log('- 自定义服务需要确保正确覆盖或补充 TypeScript 服务')
  console.log('- 服务顺序可能影响请求处理的优先级')
}

// 4. 检查潜在问题
function checkPotentialIssues() {
  console.log('\n=== 检查潜在问题 ===')
  
  const issues = [
    {
      category: '服务冲突',
      description: 'TypeScript 服务可能覆盖了我们的定义跳转功能',
      solution: '确保我们的服务能正确处理 $r() 语法并回退到 TypeScript 服务'
    },
    {
      category: '能力声明',
      description: '定义跳转能力可能没有正确声明',
      solution: '检查 LSP 初始化时的能力声明'
    },
    {
      category: '文档URI处理',
      description: 'Windows 路径格式可能导致URI解析问题',
      solution: '确保正确处理 file:// URI 格式'
    },
    {
      category: '异步处理',
      description: '资源解析是异步的，可能导致超时',
      solution: '优化资源索引构建和查找性能'
    },
    {
      category: '正则表达式',
      description: '$r() 调用的正则匹配可能不完整',
      solution: '测试各种引号格式和空格组合'
    }
  ]
  
  issues.forEach((issue, index) => {
    console.log(`\n${index + 1}. ${issue.category}`)
    console.log(`   问题: ${issue.description}`)
    console.log(`   解决: ${issue.solution}`)
  })
}

// 5. 提供调试建议
function provideDebuggingTips() {
  console.log('\n=== 调试建议 ===')
  
  const tips = [
    '在 VS Code 中按 F1，搜索 "Developer: Reload Window" 重新加载扩展',
    '打开 VS Code 开发者工具 (Help -> Toggle Developer Tools)',
    '在控制台中查找 "ETS Language Server" 相关日志',
    '检查是否有 "definitionProvider" 相关的错误信息',
    '尝试在 .ets 文件中右键点击 $r() 调用，查看是否有 "Go to Definition" 选项',
    '使用 F12 快捷键测试定义跳转功能',
    '检查语言服务器是否正常启动和运行',
    '验证项目根目录是否正确识别',
    '确认资源文件存在且格式正确'
  ]
  
  tips.forEach((tip, index) => {
    console.log(`${index + 1}. ${tip}`)
  })
}

// 运行所有检查
function runAllChecks() {
  checkServiceCapabilities()
  checkDocumentSelector()
  checkServiceLoadOrder()
  checkPotentialIssues()
  provideDebuggingTips()
  
  console.log('\n🎯 关键问题分析:')
  console.log('最可能的问题是 TypeScript 服务优先处理了定义跳转请求，')
  console.log('而我们的资源定义服务没有被调用或者返回了 null。')
  console.log('\n建议优先检查:')
  console.log('1. VS Code 控制台中的日志输出')
  console.log('2. 确认我们的服务是否被正确注册和调用')
  console.log('3. 测试 TypeScript 定义跳转是否正常工作')
}

runAllChecks()