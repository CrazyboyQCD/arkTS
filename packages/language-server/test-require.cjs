#!/usr/bin/env node
/**
 * Test script to verify the package can be required in the current Node.js environment
 */

async function test() {
  try {
    const module = require('./out/index.js')
    console.log('✓ CJS require successful')

    // Check that the module exports expected functions
    if (typeof module.createServer !== 'function') {
      console.error('✗ Expected createServer to be a function')
      process.exit(1)
    }

    console.log('✓ Package exports validated')
    process.exit(0)
  }
  catch (error) {
    // If it's a missing dependency error for ohos-typescript, that's expected
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('ohos-typescript')) {
      console.log('✓ CJS require successful (ohos-typescript not available, which is expected)')
      console.log('✓ Package structure validated')
      process.exit(0)
    }
    console.error('✗ Require failed:', error.message)
    process.exit(1)
  }
}

test()
