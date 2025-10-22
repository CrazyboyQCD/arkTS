import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'

/**
 * This script is used to copy the `@arkts/project-detector` and
 * its dependencies to the `node_modules/@arkts/project-detector`
 * and `node_modules/@arkts/project-detector-*` directory.
 *
 * So the pnpm must disable the symlink feature.
 */
async function main() {
  const projectDetectorPaths = fg.sync([
    path.resolve('../../node_modules/@arkts/project-detector'),
    path.resolve('../../node_modules/@arkts/project-detector-*'),
  ], { followSymbolicLinks: true, absolute: true, onlyFiles: false, onlyDirectories: true })

  const targetPath = path.resolve('node_modules', '@arkts')
  if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true })

  copyDirSync(path.resolve('../../node_modules/mitt'), path.resolve('node_modules', 'mitt'))

  for (const projectDetectorPath of projectDetectorPaths) {
    const targetProjectDetectorPath = path.resolve(targetPath, path.basename(projectDetectorPath))
    if (fs.existsSync(targetProjectDetectorPath)) fs.rmSync(targetProjectDetectorPath, { recursive: true })
    copyDirSync(projectDetectorPath, targetProjectDetectorPath)
  }
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
