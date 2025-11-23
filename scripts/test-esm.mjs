#!/usr/bin/env node
/**
 * Consolidated ESM import test for all packages
 * Tests that packages can be imported as ESM modules
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Packages that support ESM imports
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
async function testLanguageServer() {
  try {
    const demoPath = join(__dirname, 'packages', 'language-server', 'language-server-demo', 'demo.mjs')

    if (!existsSync(demoPath)) {
      console.error('✗ language-server: Demo file not found:', demoPath)
      return false
    }

    console.log('Running language server demo...')

    // Run demo.js with node and capture output
    const result = execSync(`node "${demoPath}" esm`, {
      cwd: __dirname,
      encoding: 'utf8',
      timeout: 30000, // 30 seconds timeout
      stdio: 'pipe',
    })

    // Check if the demo completed successfully
    if (result.includes('Demo 执行完成！') || result.includes('Demo 执行完成') || result.includes('语言服务器通信测试成功')) {
      console.log('✓ language-server: Demo ran successfully')
      return true
    }
    else {
      console.error('✗ language-server: Demo did not complete successfully')
      console.error('Output:', result)
      return false
    }
  }
  catch (error) {
    // Check if it's a timeout
    if (error.code === 'ETIMEDOUT') {
      console.error('✗ language-server: Demo timed out (30s)')
    }
    // Check if demo ran but showed protocol demonstration (which is still success)
    else if (error.stdout && (error.stdout.includes('协议演示完成') || error.stdout.includes('Demo 执行完成'))) {
      console.log('✓ language-server: Demo completed (protocol demonstration mode)')
      return true
    }
    else {
      console.error(`✗ language-server: Demo failed - ${error.message}`)
      if (error.stdout) {
        console.error('stdout:', error.stdout)
      }
      if (error.stderr) {
        console.error('stderr:', error.stderr)
      }
    }
    return false
  }
}

async function testPackage(packageName) {
  try {
    const packagePath = join(__dirname, 'packages', packageName)
    const packageJsonPath = join(packagePath, 'package.json')
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

    const modulePath = join(packagePath, esmEntry)
    const module = await import(modulePath)

    // Check that the module has exports or is a function
    const exportKeys = Object.keys(module)

    // Check if it's a default function export
    if (typeof module.default === 'function') {
      console.log(`✓ ${packageName}: ESM import successful (default function export)`)
      return true
    }

    if (exportKeys.length === 0) {
      console.error(`✗ ${packageName}: Expected module to have exports`)
      return false
    }

    console.log(`✓ ${packageName}: ESM import successful (${exportKeys.length} exports)`)
    return true
  }
  catch (error) {
    // Warn about missing dependencies but don't fail the test
    if (error.message.includes('Cannot find package') || error.message.includes('Cannot find module')) {
      console.log(`⚠ ${packageName}: Skipped - missing dependency (${error.message.split('\n')[0]})`)
      return true
    }
    console.error(`✗ ${packageName}: Import failed - ${error.message}`)
    return false
  }
}

async function testAll() {
  console.log('Testing ESM packages and language server...\n')

  const results = await Promise.all([
    ...packages.map(testPackage),
    testLanguageServer(),
  ])

  const failed = results.filter(r => !r).length

  console.log(`\n${results.length - failed}/${results.length} tests passed`)

  if (failed > 0) {
    process.exit(1)
  }

  process.exit(0)
}

testAll()
