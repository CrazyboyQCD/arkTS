import type { URI } from 'vscode-uri'
import type { FileSystemAdapter } from '../interfaces/file-system/file-system-adapter'

class NodeFileSystemImpl implements FileSystemAdapter {
  constructor(
    private readonly fs: typeof import('node:fs'),
    private readonly fg: typeof import('fast-glob'),
    private readonly process: typeof import('node:process'),
  ) {}

  async readFileToString(uri: URI, encoding: FileSystemAdapter.BufferEncoding = 'utf-8'): Promise<string> {
    return this.fs.readFileSync(uri.fsPath, encoding)
  }

  async readdir(uri: URI): Promise<string[]> {
    return this.fs.readdirSync(uri.fsPath)
  }

  async glob(pattern: string, globOptions?: FileSystemAdapter.GlobOptions): Promise<string[]> {
    return this.fg.glob(this.process.platform === 'win32' ? this.fg.convertPathToPattern(pattern) : pattern, globOptions)
  }

  async exists(uri: URI): Promise<boolean> {
    return this.fs.existsSync(uri.fsPath)
  }

  async stat(uri: URI): Promise<FileSystemAdapter.Stat> {
    return this.fs.statSync(uri.fsPath)
  }
}

export async function createNodeFileSystem(): Promise<FileSystemAdapter> {
  const fs = await import('node:fs')
  const fg = await import('fast-glob')
  const process = await import('node:process')

  return new NodeFileSystemImpl(fs, fg.default, process)
}
