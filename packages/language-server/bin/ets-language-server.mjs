#!/usr/bin/env node
import process from 'node:process'

async function run() {
  if (process.argv.includes('--version')) {
    const obj = await import('../package.json', { with: { type: 'json' } })
    // eslint-disable-next-line no-console
    console.log(`${obj.default.version}`)
  }
  else {
    await import('../out/index.mjs')
  }
}

run()
