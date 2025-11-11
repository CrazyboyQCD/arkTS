#!/usr/bin/env node
/**
 * Test script to verify the package can be imported in the current Node.js environment
 */

async function test() {
  try {
    const module = await import('./out/index.mjs')
    console.log('✓ ESM import successful')

    // Check that the module has exports
    const exportKeys = Object.keys(module)
    if (exportKeys.length === 0) {
      console.error('✗ Expected module to have exports')
      process.exit(1)
    }

    console.log(`✓ Package exports validated: ${exportKeys.join(', ')}`)
    process.exit(0)
  }
  catch (error) {
    console.error('✗ Import failed:', error.message)
    process.exit(1)
  }
}

test()
