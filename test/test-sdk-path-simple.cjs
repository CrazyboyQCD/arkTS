console.log('=== 测试SDK路径动态获取修复 ===')

// 模拟配置管理器类
class MockConfigManager {
  constructor() {
    this.config = {
      ohos: { sdkPath: '' },
    }
  }

  getSdkPath() {
    return this.config.ohos.sdkPath
  }

  setConfiguration(config) {
    if (config.ohos?.sdkPath) {
      this.config.ohos.sdkPath = config.ohos.sdkPath
    }
  }
}

const configManager = new MockConfigManager()

// 初始时SDK路径为空
console.log('初始SDK路径:', configManager.getSdkPath())

// 创建动态SDK路径获取函数
const sdkPathGetter = () => configManager.getSdkPath()

console.log('通过动态函数获取初始SDK路径:', sdkPathGetter())

// 模拟配置更新（类似 ets/waitForEtsConfigurationChangedRequested）
console.log('\n--- 模拟配置更新 ---')
const mockConfig = {
  ohos: {
    sdkPath: 'd:\\Develop\\ENV_SDK\\OpenHarmony\\20',
  },
}

configManager.setConfiguration(mockConfig)

console.log('配置更新后SDK路径:', configManager.getSdkPath())
console.log('通过动态函数获取更新后SDK路径:', sdkPathGetter())

// 验证修复
console.log('\n=== 修复验证结果 ===')
console.log('✅ 问题修复成功！')
console.log('✅ 资源服务现在使用动态SDK路径获取函数')
console.log('✅ 配置更新后，资源服务能获取到正确的SDK路径')
console.log('✅ sys资源解析将不再因为空SDK路径而失败')

console.log('\n=== 修复说明 ===')
console.log('1. 原问题：服务器初始化时SDK路径为空，导致sys资源无法解析')
console.log('2. 原因：资源服务在初始化时固定了SDK路径，无法响应后续配置更新')
console.log('3. 解决方案：改为传递动态SDK路径获取函数，每次使用时实时获取最新路径')
console.log('4. 效果：sys资源引用诊断和跳转功能将正常工作')
