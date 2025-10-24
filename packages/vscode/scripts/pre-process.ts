import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import { globalLogger } from 'tsdown'

/**
 * This script is used to copy the `@arkts/project-detector` and
 * its dependencies to the `node_modules/@arkts/project-detector`
 * and `node_modules/@arkts/project-detector-*` directory.
 *
 * So the pnpm must disable the symlink feature.
 */
async function main() {
  globalLogger.info('Cleaning node_modules...')
  fs.rmSync(path.resolve('node_modules'), { recursive: true })
  globalLogger.info('Removing package-lock.json...')
  if (fs.existsSync(path.resolve('package-lock.json'))) fs.rmSync(path.resolve('package-lock.json'))
  else globalLogger.warn('package-lock.json not found, skipping deletion')
  globalLogger.info('Installing dev & prod dependencies using npm...')
  execSync('npm install --save-dev --save-prod --verbose', { stdio: 'inherit' })
  globalLogger.info('Install done, copying workspace dependencies...')

  const projectDetectorPaths = fg.sync([
    path.resolve('../../node_modules/@arkts/project-detector'),
    path.resolve('../../node_modules/@arkts/project-detector-*'),
  ], { followSymbolicLinks: true, absolute: true, onlyFiles: false, onlyDirectories: true })

  const targetPath = path.resolve('node_modules', '@arkts')
  if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true })

  globalLogger.info('Copying workspace dependencies...')
  globalLogger.info('Copying mitt...')
  copyDirSync(path.resolve('../../node_modules/mitt'), path.resolve('node_modules', 'mitt'))
  globalLogger.info('Copying alien-signals...')
  copyDirSync(path.resolve('../../node_modules/alien-signals'), path.resolve('node_modules', 'alien-signals'))
  globalLogger.info('Copying chokidar...')
  copyDirSync(path.resolve('../../node_modules/chokidar'), path.resolve('node_modules', 'chokidar'))
  globalLogger.info('Copying readdirp...')
  copyDirSync(path.resolve('../../node_modules/readdirp'), path.resolve('node_modules', 'readdirp'))

  globalLogger.info('Copying project detector dependencies...')
  for (const projectDetectorPath of projectDetectorPaths) {
    const targetProjectDetectorPath = path.resolve(targetPath, path.basename(projectDetectorPath))
    if (fs.existsSync(targetProjectDetectorPath)) fs.rmSync(targetProjectDetectorPath, { recursive: true })
    globalLogger.info(`${path.relative(path.resolve('..', '..'), projectDetectorPath)} -> ${path.relative(path.resolve('..', '..'), targetProjectDetectorPath)}`)
    copyDirSync(projectDetectorPath, targetProjectDetectorPath)
    globalLogger.success(`${path.basename(projectDetectorPath)} copied!`)
  }
  globalLogger.success('✨ Dependencies preprocessing done!')
}

function copyDirSync(src: string, dest: string) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory not found: ${src}`)
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    }
    else if (entry.isSymbolicLink()) {
      const symlink = fs.readlinkSync(srcPath)
      fs.symlinkSync(symlink, destPath)
    }
    else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

main()
