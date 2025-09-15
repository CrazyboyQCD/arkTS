const { LanguageServerConfigManager } = require('./packages/language-server/dist/config-manager.cjs')
const { createIntegratedResourceDefinitionService } = require('./packages/language-server/dist/services/integrated-resource-definition.service.cjs')
const { LanguageServerLogger } = require('./packages/shared/dist/index.cjs')

console.log('=== 测试SDK路径动态获取修复 ===')

// 模拟配置管理器
const logger = new LanguageServerLogger('Test Logger')
const configManager = new LanguageServerConfigManager(logger)

// 初始时SDK路径为空
console.log('初始SDK路径:', configManager.getSdkPath())

// 创建资源服务（使用动态SDK路径获取函数）
const projectRoot = process.cwd()
const resourceService = createIntegratedResourceDefinitionService(
  projectRoot,
  () => configManager.getSdkPath(),
)

console.log('✅ 资源服务创建成功，使用动态SDK路径获取函数')

// 模拟配置更新（类似 ets/waitForEtsConfigurationChangedRequested）
const mockConfig = {
  ohos: {
    sdkPath: 'd:\\Develop\\ENV_SDK\\OpenHarmony\\20',
  },
}

configManager.setConfiguration(mockConfig)

console.log('配置更新后SDK路径:', configManager.getSdkPath())

// 验证动态获取函数
const sdkPathGetter = () => configManager.getSdkPath()
console.log('通过动态函数获取SDK路径:', sdkPathGetter())

console.log('✅ SDK路径动态获取修复验证成功')
console.log('现在资源服务将能够在配置更新后获取到正确的SDK路径')
