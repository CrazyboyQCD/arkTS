import type { URI } from 'vscode-uri'
import type { Directory } from '../../interfaces/file-system/file-system'
import type { FileSystemAdapter } from '../../interfaces/file-system/file-system-adapter'
import { Utils } from 'vscode-uri'
import { Readable } from '../../interfaces/file-system/file-system'
import { ReadableImpl } from './readable'

export abstract class DirectoryImpl extends ReadableImpl implements Directory {
  abstract getUri(): URI
  abstract getFileSystem(): Promise<FileSystemAdapter>

  readonly readableType: Readable.Type.Directory = Readable.Type.Directory

  async listDirectory(force: boolean = false): Promise<Array<string>> {
    return super.computedAsync('listDirectory', async () => {
      const fileSystem = await this.getFileSystem()
      return await fileSystem.readdir(this.getUri())
    }, force)
  }

  getDirectoryName(): string {
    return super.computedSync('getDirectoryName', () => Utils.basename(this.getUri()))
  }
}
