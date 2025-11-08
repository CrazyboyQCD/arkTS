#!/usr/bin/env node
import process from 'node:process'

async function run() {
  if (process.argv.includes('--version')) {
    const { version } = await import('../package.json')
    // eslint-disable-next-line no-console
    console.log(`${version}`)
  }
  else {
    await import('../out/index.mjs')
  }
}

run()
