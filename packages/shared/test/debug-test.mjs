// 调试测试：详细查看资源查找过程
import { ResourceResolver } from '../out/index.mjs'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取项目根目录（向上三级目录）
const projectRoot = path.resolve(__dirname, '../../..')

console.log('调试资源解析器...')
console.log('项目根目录:', projectRoot)

async function debugModuleFinding() {
  console.log('\n=== 调试模块查找 ===')
  
  try {
    const entries = await fs.promises.readdir(projectRoot, { withFileTypes: true })
    console.log('项目根目录下的条目:')
    
    const modules = []
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        const modulePath = path.join(projectRoot, entry.name)
        const resourcesPath = path.join(modulePath, 'src', 'main', 'resources')
        const hasResources = fs.existsSync(resourcesPath)
        
        console.log(`  ${entry.name} (目录) -> ${hasResources ? '有资源' : '无资源'}`)
        
        if (hasResources) {
          modules.push(entry.name)
          
          // 详细检查资源目录
          const basePath = path.join(resourcesPath, 'base')
          if (fs.existsSync(basePath)) {
            console.log(`    资源基础路径: ${basePath}`)
            
            const elementPath = path.join(basePath, 'element')
            const mediaPath = path.join(basePath, 'media')
            
            if (fs.existsSync(elementPath)) {
              const elementFiles = await fs.promises.readdir(elementPath)
              console.log(`    element 文件: ${elementFiles.join(', ')}`)
            }
            
            if (fs.existsSync(mediaPath)) {
              const mediaFiles = await fs.promises.readdir(mediaPath)
              console.log(`    media 文件: ${mediaFiles.join(', ')}`)
            }
          }
        }
      }
    }
    
    console.log(`\n找到的模块: ${modules.join(', ')}`)
    return modules
    
  } catch (error) {
    console.error('模块查找失败:', error)
    return []
  }
}

async function debugSpecificResources() {
  console.log('\n=== 调试具体资源文件 ===')
  
  // 手动检查 sample 模块的资源
  const sampleResourcePath = path.join(projectRoot, 'sample', 'entry', 'src', 'main', 'resources', 'base')
  console.log('Sample entry 资源路径:', sampleResourcePath)
  console.log('路径存在:', fs.existsSync(sampleResourcePath))
  
  if (fs.existsSync(sampleResourcePath)) {
    // 检查 element 目录
    const elementPath = path.join(sampleResourcePath, 'element')
    if (fs.existsSync(elementPath)) {
      console.log('\nelement 目录内容:')
      const elementFiles = await fs.promises.readdir(elementPath)
      
      for (const file of elementFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(elementPath, file)
          console.log(`  ${file}:`)
          
          try {
            const content = await fs.promises.readFile(filePath, 'utf-8')
            const json = JSON.parse(content)
            console.log(`    内容: ${JSON.stringify(json, null, 2)}`)
          } catch (error) {
            console.log(`    读取失败: ${error.message}`)
          }
        }
      }
    }
    
    // 检查 media 目录
    const mediaPath = path.join(sampleResourcePath, 'media')
    if (fs.existsSync(mediaPath)) {
      console.log('\nmedia 目录内容:')
      const mediaFiles = await fs.promises.readdir(mediaPath)
      mediaFiles.forEach(file => {
        console.log(`  ${file}`)
      })
    }
  }
  
  // 同样检查 sampleLibrary
  const libResourcePath = path.join(projectRoot, 'sample', 'sampleLibrary', 'src', 'main', 'resources', 'base')
  console.log('\nSample library 资源路径:', libResourcePath)
  console.log('路径存在:', fs.existsSync(libResourcePath))
  
  if (fs.existsSync(libResourcePath)) {
    const elementPath = path.join(libResourcePath, 'element')
    if (fs.existsSync(elementPath)) {
      console.log('\nlibrary element 目录内容:')
      const elementFiles = await fs.promises.readdir(elementPath)
      elementFiles.forEach(file => {
        console.log(`  ${file}`)
      })
    }
  }
}

async function testDifferentRoots() {
  console.log('\n=== 测试不同的根目录 ===')
  
  // 测试以 sample 作为项目根目录
  const sampleRoot = path.join(projectRoot, 'sample')
  console.log('使用 sample 作为根目录:', sampleRoot)
  
  const resolver = new ResourceResolver(sampleRoot)
  await resolver.buildIndex()
  
  const resources = resolver.getAllResources()
  console.log(`在 sample 根目录下找到 ${resources.length} 个资源`)
  
  if (resources.length > 0) {
    console.log('资源列表:')
    resources.forEach((resource, index) => {
      console.log(`  ${index + 1}. ${resource.reference.raw} -> ${path.basename(resource.location.uri)}`)
      if (resource.location.value) {
        console.log(`     值: ${resource.location.value}`)
      }
    })
  }
}

async function runDebug() {
  try {
    await debugModuleFinding()
    await debugSpecificResources()
    await testDifferentRoots()
    console.log('\n调试完成！')
  } catch (error) {
    console.error('调试失败:', error)
  }
}

runDebug()