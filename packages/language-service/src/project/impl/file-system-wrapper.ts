import type { FileSystemAdapter } from '../proto/fs'
import type { OpenHarmonyProjectDetectorImpl } from './project-detector'
import { URI } from 'vscode-uri'

/**
 * @private
 */
export class FileSystemWrapper implements FileSystemAdapter {
  constructor(
    private readonly fs: FileSystemAdapter,
    private readonly projectDetector: OpenHarmonyProjectDetectorImpl,
  ) {}

  async readFile(filePath: string, encoding?: FileSystemAdapter.BufferEncodingWithString): Promise<string> {
    const textDocuments = await this.projectDetector.getUpdatedTextDocuments()
    const uri = URI.parse(filePath)
    const foundTextDocument = textDocuments.find(textDocument =>
      textDocument.uri === uri.toString()
      || textDocument.uri === uri.fsPath
      || textDocument.uri === uri.path,
    )
    if (foundTextDocument)
      return foundTextDocument.getText()
    return this.fs.readFile(filePath, encoding)
  }

  glob(pattern: string): Promise<string[]> {
    return this.fs.glob(pattern)
  }

  stat(filePath: string): Promise<FileSystemAdapter.Stats> {
    return this.fs.stat(filePath)
  }

  exists(filePath: string): Promise<boolean> {
    return this.fs.exists(filePath)
  }

  readdir(filePath: string): Promise<string[]> {
    return this.fs.readdir(filePath)
  }
}
