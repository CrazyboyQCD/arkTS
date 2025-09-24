import { Disposable } from 'unioc/vscode'
import * as vscode from 'vscode'
import { FileSystem } from './fs/file-system'

@Disposable
export class AbstractWatcher extends FileSystem implements Disposable {
  private _vscodeWatcher: vscode.FileSystemWatcher | undefined

  get vscodeWatcher(): vscode.FileSystemWatcher {
    if (!this._vscodeWatcher) {
      this._vscodeWatcher = vscode.workspace.createFileSystemWatcher('**/*')
      this._vscodeWatcher.onDidChange((uri) => {
        this.getConsola().warn(`${uri.fsPath} is changed.`)
      })
    }
    return this._vscodeWatcher
  }

  async dispose(): Promise<void> {
    this._vscodeWatcher?.dispose()
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.dispose()
  }
}
