#!/usr/bin/env node

/**
 * 测试 sys 资源解析功能
 */

const { ResourceResolver } = require('@arkts/shared');

async function testSysResourceResolution() {
  console.log('=== 测试 sys 资源解析功能 ===');
  
  const projectRoot = 'C:\\Users\\Administrator\\Desktop\\arkTS';
  const mockSdkPath = 'C:\\Users\\Administrator\\Desktop\\arkTS\\mock-sdk';
  
  // 创建带有 SDK 路径的资源解析器
  const resolver = new ResourceResolver(projectRoot, mockSdkPath);
  
  console.log('项目根路径:', projectRoot);
  console.log('模拟 SDK 路径:', mockSdkPath);
  
  try {
    console.log('\n构建资源索引...');
    await resolver.buildIndex();
    
    const allResources = resolver.getAllResources();
    console.log(`\n✅ 资源解析器初始化成功，找到 ${allResources.length} 个资源`);
    
    // 分别统计 app 和 sys 资源
    const appResources = allResources.filter(r => r.reference.scope === 'app');
    const sysResources = allResources.filter(r => r.reference.scope === 'sys');
    
    console.log(`  - app 资源: ${appResources.length} 个`);
    console.log(`  - sys 资源: ${sysResources.length} 个`);
    
    // 测试一些具体的 sys 资源引用
    const testSysRefs = [
      'sys.color.ohos_id_color_foreground',
      'sys.string.ohos_id_cancel',
      'sys.float.ohos_id_alpha_content_primary',
      'sys.media.ohos_app_icon',
      'sys.symbol.ohos_wifi',
      'sys.plural.notification_count'
    ];
    
    console.log('\n=== 测试 sys 资源解析 ===');
    for (const ref of testSysRefs) {
      const result = await resolver.resolveResourceReference(ref);
      if (result) {
        console.log(`✅ ${ref}:`);
        console.log(`   → ${result.value}`);
        console.log(`   → 文件: ${result.uri}`);
      } else {
        console.log(`❌ ${ref}: 未找到`);
      }
    }
    
    // 测试一些不存在的 sys 资源
    console.log('\n=== 测试不存在的 sys 资源 ===');
    const nonExistentRefs = [
      'sys.color.nonexistent_color',
      'sys.string.missing_string'
    ];
    
    for (const ref of nonExistentRefs) {
      const result = await resolver.resolveResourceReference(ref);
      if (result) {
        console.log(`❌ ${ref}: 意外找到了资源 (这是错误)`);
      } else {
        console.log(`✅ ${ref}: 正确返回未找到`);
      }
    }
    
    // 显示一些 sys 资源的详细信息
    console.log('\n=== sys 资源详细信息 ===');
    const sysColorResources = sysResources.filter(r => r.reference.type === 'color');
    console.log(`\nsys.color 资源 (${sysColorResources.length} 个):`);
    sysColorResources.slice(0, 5).forEach(resource => {
      console.log(`  ${resource.reference.name}: ${resource.location.value}`);
    });
    
    const sysStringResources = sysResources.filter(r => r.reference.type === 'string');
    console.log(`\nsys.string 资源 (${sysStringResources.length} 个):`);
    sysStringResources.slice(0, 5).forEach(resource => {
      console.log(`  ${resource.reference.name}: ${resource.location.value}`);
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  testSysResourceResolution();
}