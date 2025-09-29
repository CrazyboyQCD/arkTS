import type { File } from '../../interfaces/file-system/file-system'
import { Readable } from '../../interfaces/file-system/file-system'
import { ReadableImpl } from './readable'

export abstract class FileImpl extends ReadableImpl implements File {
  readonly readableType: Readable.Type.File = Readable.Type.File

  async readToString(force: boolean = false): Promise<string> {
    return super.computedAsync('readToString', async () => {
      const textDocumentUpdater = this.getTextDocumentUpdater()
      const textDocument = textDocumentUpdater?.getTextDocumentByUri(this.getUri())
      if (textDocument) return textDocument.getText()

      const fileSystem = await this.getFileSystem()
      return fileSystem.readFileToString(this.getUri())
    }, force)
  }

  async isExist(force: boolean = false): Promise<boolean> {
    return super.computedAsync('isExist', async () => {
      const fileSystem = await this.getFileSystem()
      return await fileSystem.exists(this.getUri()) && (await fileSystem.stat(this.getUri())).isFile()
    }, force)
  }
}
