import type { TextDocument } from '@volar/language-server'
import type { URI } from 'vscode-uri'

/**
 * The file system adapter.
 *
 * There are have an node.js adapter available using `createNodeFileSystemAdapter()`.
 * By default, the `FileSystemAdapter` will use the `node.js` adapter.
 */
export interface FileSystemAdapter {
  /**
   * Read the file content.
   *
   * @param filePath - The file path.
   * @param encoding - The file encoding. If not provided, the `utf-8` encoding will be used.
   */
  readFile(filePath: string, encoding?: FileSystemAdapter.BufferEncodingWithString): Promise<string>
  /**
   * Read the file content as buffer.
   *
   * @param filePath - The file path.
   */
  readFileAsBuffer(filePath: string): Promise<ArrayBuffer | SharedArrayBuffer>
  /**
   * Glob the file paths.
   *
   * @param pattern - The glob pattern.
   * @returns The file paths.
   */
  glob(pattern: string, options?: FileSystemAdapter.GlobOptions): Promise<string[]>
  /**
   * Stat the file.
   *
   * @param filePath - The file path.
   * @returns The file stat.
   */
  stat(filePath: string): Promise<FileSystemAdapter.Stats>
  /**
   * Check if the file path exists.
   *
   * @param filePath - The file path.
   */
  exists(filePath: string): Promise<boolean>
  /**
   * Read the directory.
   *
   * @param filePath - The file path.
   * @returns The directory.
   */
  readdir(filePath: string): Promise<string[]>
}

export namespace FileSystemAdapter {
  export type BufferEncoding
    = | 'ascii'
      | 'utf8'
      | 'utf-8'
      | 'utf16le'
      | 'utf-16le'
      | 'ucs2'
      | 'ucs-2'
      | 'base64'
      | 'base64url'
      | 'latin1'
      | 'binary'
      | 'hex'

  export type BufferEncodingWithString = BufferEncoding | (string & {})

  export interface GlobOptions {
    onlyFiles?: boolean
    onlyDirectories?: boolean
    absolute?: boolean
    ignore?: string[]
  }

  export interface Stats {
    /**
     * Check if the file is a directory.
     */
    isDirectory(): boolean
    /**
     * Check if the file is a file.
     */
    isFile(): boolean
  }
}

export interface FileSystemUpdater {
  /**
   * Find the updated text document.
   *
   * @param filePath - The file path.
   */
  findUpdatedTextDocument(filePath: URI): Promise<TextDocument | null>
  /**
   * Get the updated text documents.
   */
  getUpdatedTextDocuments(): Promise<TextDocument[]>
  /**
   * Update the file.
   */
  updateFile(uri: URI): Promise<void>
  /**
   * Update the text document.
   */
  updateTextDocument(textDocument: TextDocument): Promise<void>
}
