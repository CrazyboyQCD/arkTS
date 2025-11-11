#!/usr/bin/env node
/**
 * Test script to verify the package build artifacts exist
 * This is a VSCode extension package, so we just check file existence
 */

const fs = require('node:fs')
const path = require('node:path')

async function test() {
  try {
    const mainFile = path.join(__dirname, 'dist', 'client.js')

    if (!fs.existsSync(mainFile)) {
      console.error('✗ Main file not found:', mainFile)
      process.exit(1)
    }

    const stats = fs.statSync(mainFile)
    if (stats.size === 0) {
      console.error('✗ Main file is empty')
      process.exit(1)
    }

    console.log('✓ VSCode extension build artifacts validated')
    console.log(`✓ Main file size: ${(stats.size / 1024).toFixed(2)} KB`)
    process.exit(0)
  }
  catch (error) {
    console.error('✗ Test failed:', error.message)
    process.exit(1)
  }
}

test()
