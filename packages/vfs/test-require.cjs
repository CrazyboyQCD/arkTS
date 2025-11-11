#!/usr/bin/env node
/**
 * Test script to verify the package can be required in the current Node.js environment
 */

async function test() {
  try {
    const module = require('./dist/index.js')
    console.log('✓ CJS require successful')

    // Check that the module is a function (default export)
    if (typeof module === 'function') {
      console.log('✓ Package exports validated: default function export')
      process.exit(0)
    }

    // Or check if it has named exports
    const exportKeys = Object.keys(module)
    if (exportKeys.length === 0) {
      console.error('✗ Expected module to have exports or be a function')
      process.exit(1)
    }

    console.log(`✓ Package exports validated: ${exportKeys.join(', ')}`)
    process.exit(0)
  }
  catch (error) {
    console.error('✗ Require failed:', error.message)
    process.exit(1)
  }
}

test()
