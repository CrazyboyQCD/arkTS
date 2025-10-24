import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { globalLogger } from 'tsdown'

async function main() {
  globalLogger.info('Removing npm installed node_modules...')
  fs.rmSync(path.resolve('node_modules'), { recursive: true, force: true })
  if (fs.existsSync(path.resolve('package-lock.json'))) fs.rmSync(path.resolve('package-lock.json'), { force: true })
  else globalLogger.warn('package-lock.json not found, skipping deletion')
  globalLogger.info('Reinstalling dependencies using pnpm...')
  execSync('pnpm install', { cwd: path.resolve('..', '..'), stdio: 'inherit' })
  globalLogger.success('✨ Dependencies cleaning process done!')
}

main()
