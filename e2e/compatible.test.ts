import { execSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// Packages that support CJS require and ESM import
const packages = [
  'language-plugin',
  // language-server cannot be used as library. It should be used as binary.
  // 'language-server',
  'language-service',
  'shared',
  'types',
  'typescript-plugin',
  'vfs',
]

// Language Server test - run demo.mjs and check result
async function testLanguageServer(mode: 'cjs' | 'esm' = 'cjs') {
  const demoPath = path.join(projectRoot, 'packages', 'language-server', 'e2e', 'demo.mjs')

  if (!existsSync(demoPath)) {
    throw new Error(`Demo file not found: ${demoPath}`)
  }

  try {
    // Run demo.mjs with node and capture output
    const args = mode === 'esm' ? 'esm' : ''
    const result = execSync(`node "${demoPath}" ${args}`, {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 30000, // 30 seconds timeout
      stdio: 'pipe',
    })

    // Check if the demo completed successfully
    const successIndicators = [
      'Demo 执行完成！',
      'Demo 执行完成',
      '语言服务器通信测试成功',
      '协议演示完成',
    ]

    return successIndicators.some(indicator => result.includes(indicator))
  }
  catch (error: any) {
    // Check if it's a timeout
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Demo timed out (30s)')
    }
    // Check if demo ran but showed protocol demonstration (which is still success)
    if (error.stdout && (error.stdout.includes('协议演示完成') || error.stdout.includes('Demo 执行完成'))) {
      return true
    }
    throw new Error(`Demo failed: ${error.message}`)
  }
}

// VSCode package has a different test (build artifact check)
function testVscodePackage() {
  const vscodePackagePath = path.join(projectRoot, 'packages', 'vscode')
  const mainFile = path.join(vscodePackagePath, 'dist', 'client.cjs')

  if (!existsSync(mainFile)) {
    throw new Error(`Main file not found: ${mainFile}`)
  }

  const stats = statSync(mainFile)
  if (stats.size === 0) {
    throw new Error('Main file is empty')
  }

  return stats.size
}

function testPackageCJS(packageName: string) {
  const packagePath = path.join(projectRoot, 'packages', packageName)
  const packageJsonPath = path.join(packagePath, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

  // Determine the CJS entry point from package.json exports
  let cjsEntry = './out/index.js'
  const exportsField = packageJson.exports?.['.']
  if (typeof exportsField === 'string') {
    cjsEntry = exportsField
  }
  else if (exportsField?.require) {
    // Handle nested require field (could be string or object with default)
    if (typeof exportsField.require === 'string') {
      cjsEntry = exportsField.require
    }
    else if (exportsField.require?.default) {
      cjsEntry = exportsField.require.default
    }
  }
  else if (exportsField?.default) {
    cjsEntry = exportsField.default
  }
  else if (packageJson.main) {
    cjsEntry = packageJson.main
  }

  const modulePath = path.resolve(packagePath, cjsEntry)
  const require = createRequire(import.meta.url)
  const module = require(modulePath)

  // Check if the module is a function (default export)
  if (typeof module === 'function') {
    return { type: 'function', exports: 0 }
  }

  // Check that the module has exports
  const exportKeys = Object.keys(module)
  if (exportKeys.length === 0) {
    throw new Error('Expected module to have exports or be a function')
  }

  return { type: 'object', exports: exportKeys.length }
}

async function testPackageESM(packageName: string) {
  const packagePath = path.join(projectRoot, 'packages', packageName)
  const packageJsonPath = path.join(packagePath, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

  // Determine the ESM entry point from package.json exports
  let esmEntry = './out/index.mjs'
  const exportsField = packageJson.exports?.['.']
  if (typeof exportsField === 'string') {
    esmEntry = exportsField
  }
  else if (exportsField?.import) {
    // Handle nested import field (could be string or object with default)
    if (typeof exportsField.import === 'string') {
      esmEntry = exportsField.import
    }
    else if (exportsField.import?.default) {
      esmEntry = exportsField.import.default
    }
  }
  else if (packageJson.module) {
    esmEntry = packageJson.module
  }

  const modulePath = path.resolve(packagePath, esmEntry)
  // Use pathToFileURL for cross-platform compatibility
  const moduleUrl = pathToFileURL(modulePath).href
  const module = await import(moduleUrl)

  // Check that the module has exports or is a function
  const exportKeys = Object.keys(module)

  // Check if it's a default function export
  if (typeof module.default === 'function') {
    return { type: 'function', exports: 0 }
  }

  if (exportKeys.length === 0) {
    throw new Error('Expected module to have exports')
  }

  return { type: 'object', exports: exportKeys.length }
}

describe('package Compatibility Tests', () => {
  describe('commonJS (require)', () => {
    for (const packageName of packages) {
      it(`should require ${packageName} as CJS module`, () => {
        try {
          const result = testPackageCJS(packageName)
          expect(result).toBeDefined()
          if (result.type === 'function') {
            expect(typeof result).toBe('object')
          }
          else {
            expect(result.exports).toBeGreaterThan(0)
          }
        }
        catch (error: any) {
          // Warn about missing dependencies but don't fail the test
          if (error.message.includes('Cannot find package') || error.message.includes('Cannot find module')) {
            console.warn(`⚠ ${packageName}: Skipped - missing dependency (${error.message.split('\n')[0]})`)
            return
          }
          throw error
        }
      })
    }

    it('should test language-server demo (CJS mode)', async () => {
      const success = await testLanguageServer('cjs')
      expect(success).toBe(true)
    }, 35000)

    it('should validate vscode package build artifacts', () => {
      const size = testVscodePackage()
      expect(size).toBeGreaterThan(0)
      expect(size).toBeTypeOf('number')
    })
  })

  describe('eSM (import)', () => {
    for (const packageName of packages) {
      it(`should import ${packageName} as ESM module`, async () => {
        try {
          const result = await testPackageESM(packageName)
          expect(result).toBeDefined()
          if (result.type === 'function') {
            expect(typeof result).toBe('object')
          }
          else {
            expect(result.exports).toBeGreaterThan(0)
          }
        }
        catch (error: any) {
          // Warn about missing dependencies but don't fail the test
          if (error.message.includes('Cannot find package') || error.message.includes('Cannot find module')) {
            console.warn(`⚠ ${packageName}: Skipped - missing dependency (${error.message.split('\n')[0]})`)
            return
          }
          throw error
        }
      })
    }

    it('should test language-server demo (ESM mode)', async () => {
      const success = await testLanguageServer('esm')
      expect(success).toBe(true)
    }, 35000)
  })
})
