import type { URI } from 'vscode-uri'
import type { Readable } from '../../interfaces/file-system/file-system'
import type { FileSystemAdapter } from '../../interfaces/file-system/file-system-adapter'
import type { TextDocumentUpdater } from '../../interfaces/project-detector'
import { Cacheable } from './cacheable'

export abstract class ReadableImpl extends Cacheable implements Readable {
  abstract getUri(): URI
  abstract getFileSystem(): Promise<FileSystemAdapter>
  abstract getTextDocumentUpdater(): TextDocumentUpdater

  async isExist(force: boolean = false): Promise<boolean> {
    return super.computedAsync('isExist', async () => {
      const fileSystem = await this.getFileSystem()
      return await fileSystem.exists(this.getUri())
    }, force)
  }
}
