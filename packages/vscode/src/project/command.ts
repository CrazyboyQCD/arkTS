import fs from 'node:fs'
import path from 'node:path'
import { BirpcReturn, createBirpc } from 'birpc'
import { Autowired } from 'unioc'
import { Command, IOnActivate } from 'unioc/vscode'
import * as vscode from 'vscode'
import { useCompiledWebviewPanel } from '../hook/compiled-webview'
import { keepClassInstanceThis } from '../utils/keep-this'
import { ConnectionProtocol } from './interfaces/connection-protocol'
import { ServerFunctionImpl } from './server-function'

@Command('ets.createProject')
export class CreateProjectCommand implements Command, IOnActivate {
  @Autowired
  private readonly serverFunction: ServerFunctionImpl

  private currentCreateProjectWebviewPanel: vscode.WebviewPanel | undefined
  private currentCreateProjectConnection: BirpcReturn<ConnectionProtocol.ClientFunction, ConnectionProtocol.ServerFunction> | undefined
  private extensionUri: vscode.Uri

  onActivate(context: vscode.ExtensionContext): void {
    this.extensionUri = context.extensionUri
  }

  private async createProjectWebviewPanel(): Promise<void> {
    if (this.currentCreateProjectWebviewPanel && this.currentCreateProjectConnection) {
      return this.currentCreateProjectWebviewPanel.reveal(vscode.ViewColumn.One)
    }
    this.currentCreateProjectWebviewPanel = vscode.window.createWebviewPanel(
      'ets-create-project-view',
      'ETS Create Project',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        enableCommandUris: true,
        enableForms: true,
        retainContextWhenHidden: true,
      },
    )
    this.currentCreateProjectWebviewPanel.webview.html = fs.readFileSync(path.resolve(this.extensionUri.fsPath, 'build', 'project.html'), 'utf-8')
    useCompiledWebviewPanel(this.currentCreateProjectWebviewPanel, path.resolve(this.extensionUri.fsPath, 'build', 'project.html'))
    this.currentCreateProjectConnection = createBirpc<ConnectionProtocol.ClientFunction, ConnectionProtocol.ServerFunction>(keepClassInstanceThis(this.serverFunction), {
      on: fn => this.currentCreateProjectWebviewPanel?.webview.onDidReceiveMessage(msg => fn(msg)),
      post: data => this.currentCreateProjectWebviewPanel?.webview.postMessage(data),
      serialize: data => JSON.stringify(data),
      deserialize: data => JSON.parse(data),
    })
    this.currentCreateProjectWebviewPanel.onDidDispose(() => {
      this.currentCreateProjectConnection?.$close()
      this.currentCreateProjectWebviewPanel = undefined
      this.currentCreateProjectConnection = undefined
    })
  }

  onExecuteCommand(): void {
    this.createProjectWebviewPanel()
  }
}
