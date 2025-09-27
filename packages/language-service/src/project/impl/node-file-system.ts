import type { FileSystemAdapter } from '../proto/fs'

class NodeFileSystemAdapter implements FileSystemAdapter {
  async readFile(filePath: string, encoding: FileSystemAdapter.BufferEncodingWithString = 'utf-8'): Promise<string> {
    const fs = await import('node:fs/promises')
    return fs.readFile(filePath, encoding as FileSystemAdapter.BufferEncoding)
  }

  async readFileAsBuffer(filePath: string): Promise<ArrayBuffer | SharedArrayBuffer> {
    const fs = await import('node:fs/promises')
    return fs.readFile(filePath).then(buffer => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
  }

  async glob(pattern: string): Promise<string[]> {
    const fg = await import('fast-glob')
    const process = await import('node:process')

    return fg.glob(process.platform === 'win32' ? fg.convertPathToPattern(pattern) : pattern)
  }

  async stat(filePath: string): Promise<FileSystemAdapter.Stats> {
    const fs = await import('node:fs/promises')
    return fs.stat(filePath)
  }

  async exists(filePath: string): Promise<boolean> {
    const fs = await import('node:fs/promises')
    return fs.access(filePath).then(() => true).catch(() => false)
  }

  async readdir(filePath: string): Promise<string[]> {
    const fs = await import('node:fs/promises')
    return fs.readdir(filePath)
  }
}

export async function createNodeFileSystemAdapter(): Promise<FileSystemAdapter> {
  return new NodeFileSystemAdapter()
}
