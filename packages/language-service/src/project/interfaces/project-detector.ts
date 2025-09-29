import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { URI } from 'vscode-uri'
import type { Resetable } from './common'
import type { FileSystemAdapter } from './file-system/file-system-adapter'
import type { Workspace } from './workspace'
import { TextDocumentUpdaterImpl } from '../classes/common/textdocument-updater'
import { ProjectDetectorImpl } from '../classes/project-detector'

/**
 * {@linkcode TextDocumentUpdater} represents a text document updater.
 *
 * A text document updater is used to record the status information of files that
 * have been updated in the editor. If the file is saved, the updated status
 * information will be removed from the list.
 *
 * ---
 *
 * {@linkcode TextDocumentUpdater} 代表一个文本文档更新器，用于记录文件
 * 在编辑器中被更新的状态信息。如果文件被保存，则将更新状态信息从列表中移除。
 */
export interface TextDocumentUpdater extends Resetable {
  /**
   * Update the file.
   *
   * When called the updated text document will be removed from the list.
   *
   * @param uri - The URI of the file to update.
   */
  updateFile(uri: string): Promise<void>
  /**
   * Update the text document.
   *
   * When called the updated text document will be updated in the list, if
   * the text document is not exist it will be added to the list.
   *
   * @param textDocument - The text document to update.
   */
  updateTextDocument(textDocument: TextDocument): Promise<void>
  /**
   * Get the text document by URI.
   *
   * @param uri - The URI of the text document to get.
   * @returns The text document.
   */
  getTextDocumentByUri(uri: string | URI): TextDocument | undefined
}

export namespace TextDocumentUpdater {
  export function is(value: unknown): value is TextDocumentUpdater {
    return value instanceof TextDocumentUpdaterImpl
  }
}

export interface ProjectDetector {
  /**
   * Get the workspace folder of the project detector.
   *
   * @returns The workspace folder of the project detector.
   */
  getWorkspaceFolder(): URI
  /**
   * Check if the workspace folder exists.
   *
   * @param force - Whether to force the check, default is false. If true, the check will be performed again.
   * @returns True if the workspace folder exists, false otherwise.
   */
  isWorkspaceFolderExist(force?: boolean): Promise<boolean>
  /**
   * Get the text document updater of the project detector.
   *
   * @returns The text document updater of the project detector.
   */
  getTextDocumentUpdater(): TextDocumentUpdater
  /**
   * Find the workspaces of the project detector.
   *
   * @param force - Whether to force the find, default is false. If true, the find will be performed again.
   * @returns The workspaces of the project detector.
   */
  findWorkspaces(force?: boolean): Promise<Workspace[]>
  /**
   * Get the file system of the project detector.
   *
   * @returns The file system of the project detector.
   */
  getFileSystem(): Promise<FileSystemAdapter>
}

export namespace ProjectDetector {
  export function is(value: unknown): value is ProjectDetector {
    return value instanceof ProjectDetectorImpl
  }
}
