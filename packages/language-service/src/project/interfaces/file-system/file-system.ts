import type { URI } from 'vscode-uri'
import type { Resetable } from '../common'
import type { TextDocumentUpdater } from '../project-detector'
import type { FileSystemAdapter } from './file-system-adapter'
import { DirectoryImpl } from '../../classes/common/directory'
import { FileImpl } from '../../classes/common/file'
import { ReadableImpl } from '../../classes/common/readable'

/**
 * {@linkcode Readable} represents a uniquely readable object.
 *
 * ---
 *
 * {@linkcode Readable} 代表一个唯一可读取的对象。
 */
export interface Readable extends Resetable {
  /**
   * Get the URI of the current readable instance.
   */
  getUri(): URI
  /**
   * Check if the file exists.
   *
   * @param force - Whether to force the check, default is false. If true, the check will be performed again.
   * @returns True if the file exists, false otherwise.
   */
  isExist(force?: boolean): Promise<boolean>
  /**
   * Get the file system of the current file instance.
   *
   * @returns The file system.
   */
  getFileSystem(): Promise<FileSystemAdapter>
  /**
   * Get the text document updater of the current file instance.
   *
   * @returns The text document updater.
   */
  getTextDocumentUpdater(): TextDocumentUpdater
}

export namespace Readable {
  export enum Type {
    File,
    Directory,
  }

  export function is(value: unknown): value is Readable {
    return value instanceof ReadableImpl
  }
}

/**
 * {@linkcode File} represents a file.
 *
 * ---
 *
 * {@linkcode File} 代表一个文件。
 */
export interface File extends Readable {
  /**
   * The type of the readable.
   */
  readonly readableType: Readable.Type.File
  /**
   * Read the file content as a string. If the file is updated, will return the updated content.
   *
   * @param force - Whether to force the read, default is false. If true, the read will be performed again.
   * @returns The file content as a string.
   */
  readToString(force?: boolean): Promise<string>
}

export namespace File {
  export function is(value: unknown): value is File {
    return value instanceof FileImpl
  }
}

/**
 * {@linkcode Directory} represents a directory.
 *
 * ---
 *
 * {@linkcode Directory} 代表一个目录。
 */
export interface Directory extends Readable {
  /**
   * The type of the readable.
   */
  readonly readableType: Readable.Type.Directory
  /**
   * List the files and directories in the current directory.
   *
   * @param force - Whether to force the list, default is false. If true, the list will be performed again.
   * @returns The list of files and directories.
   */
  listDirectory(force?: boolean): Promise<Array<string>>
  /**
   * Get the name of the directory.
   *
   * @returns The name of the directory.
   */
  getDirectoryName(): string
}

export namespace Directory {
  export function is(value: unknown): value is Directory {
    return value instanceof DirectoryImpl
  }
}
