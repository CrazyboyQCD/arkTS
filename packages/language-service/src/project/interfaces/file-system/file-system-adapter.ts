import type { URI } from 'vscode-uri'

/**
 * {@linkcode FileSystemAdapter} represents a file system adapter.
 *
 * A file system adapter is used to read, write, and manage files and directories.
 * If not provided, the default will be the file system adapter based on `Node.js`.
 *
 * ---
 *
 * {@linkcode FileSystemAdapter} 代表一个文件系统适配器。
 *
 * 一个文件系统适配器用于读取、写入和管理文件和目录。可以依赖当前环境实现任意的文件
 * 系统适配器，如果未提供，默认将使用基于`Node.js`环境的文件系统适配器。
 */
export interface FileSystemAdapter {
  /**
   * Read the file content as a string.
   *
   * @param uri - The URI of the file to read.
   * @returns The file content as a string.
   */
  readFileToString(uri: URI, encoding?: FileSystemAdapter.BufferEncoding): Promise<string>
  /**
   * Search for files matching the given pattern.
   *
   * @param pattern - The pattern to match.
   * @param globOptions - The options to use for the glob.
   * @returns The files matching the pattern.
   */
  glob(pattern: string, globOptions?: FileSystemAdapter.GlobOptions): Promise<string[]>
  /**
   * Check if the file exists.
   *
   * @param uri - The URI of the file to check.
   * @returns True if the file exists, false otherwise.
   */
  exists(uri: URI): Promise<boolean>
  /**
   * Get the file stat.
   *
   * @param uri - The URI of the file to get the stat.
   * @returns The file stat.
   */
  stat(uri: URI): Promise<FileSystemAdapter.Stat>
  /**
   * Read the directory.
   *
   * @param uri - The URI of the directory to read.
   * @returns The files and directories in the directory.
   */
  readdir(uri: URI): Promise<string[]>
}

export namespace FileSystemAdapter {
  export interface Stat {
    isFile(): boolean
    isDirectory(): boolean
  }

  export interface GlobOptions {
    absolute?: boolean
    ignore?: string[]
    onlyFiles?: boolean
    onlyDirectories?: boolean
  }

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
}
