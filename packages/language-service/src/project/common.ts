import type { LanguageServerLogger } from '@arkts/shared'
import type { TextDocument } from '@volar/language-service'
import type { URI } from 'vscode-uri'
import type { OpenHarmonyProject } from './proto'
import type { FileSystemUpdater } from './proto/fs'
import { ModuleOpenHarmonyProject } from './proto'

export abstract class AbstractFileSystem implements FileSystemUpdater {
  private readonly _updatedTextDocuments: TextDocument[] = []

  abstract findProjects(): Promise<OpenHarmonyProject[]>

  abstract getLogger(prefix?: string): LanguageServerLogger

  async updateTextDocument(textDocument: TextDocument): Promise<void> {
    const foundIndex = this._updatedTextDocuments.findIndex(updatedTextDocument => updatedTextDocument.uri === textDocument.uri)
    if (foundIndex === -1)
      this._updatedTextDocuments.push(textDocument)
    else
      this._updatedTextDocuments[foundIndex] = textDocument
  }

  async findUpdatedTextDocument(filePath: URI): Promise<TextDocument | null> {
    return this._updatedTextDocuments.find(updatedTextDocument => updatedTextDocument.uri === filePath.toString()
      || updatedTextDocument.uri === filePath.fsPath
      || updatedTextDocument.uri === filePath.path) ?? null
  }

  async getUpdatedTextDocuments(): Promise<TextDocument[]> {
    return this._updatedTextDocuments
  }

  async updateFile(uri: URI): Promise<void> {
    this.getLogger('AbstractFileSystem/updateFile').getConsola().info(`FILE UPDATED: ${uri.toString()}`)
    this.getLogger('AbstractFileSystem/updateFile').getConsola().info(`UPDATED FILES: ${this._updatedTextDocuments.length} <> ${this._updatedTextDocuments.map(updatedTextDocument => updatedTextDocument.uri).join(', ')}`)
    const foundIndex = this._updatedTextDocuments.findIndex(updatedTextDocument => updatedTextDocument.uri === uri.toString()
      || updatedTextDocument.uri === uri.fsPath
      || updatedTextDocument.uri === uri.path)
    if (foundIndex !== -1) {
      this._updatedTextDocuments.splice(foundIndex, 1)
      this.getLogger('AbstractFileSystem/updateFile').getConsola().info(`UPDATED FILE REMOVED: ${uri.toString()}`)
    }

    const projects = await this.findProjects()

    for (const project of projects) {
      if (uri.toString() === project.getProjectRoot().toString()) {
        await project.reset()
        continue
      }

      if (ModuleOpenHarmonyProject.is(project)) {
        const openHarmonyModules = await project.readOpenHarmonyModules()

        for (const openHarmonyModule of openHarmonyModules) {
          if (uri.toString() === openHarmonyModule.getModulePath().toString()) {
            await openHarmonyModule.reset()
            continue
          }

          if (uri.toString() === openHarmonyModule.getModuleJson5Path().toString()) {
            await openHarmonyModule.reset()
            continue
          }

          const resourceFolders = await openHarmonyModule.readResourceFolder()
          for (const resourceFolder of resourceFolders || []) {
            if (uri.toString() === resourceFolder.getUri().toString()) {
              await resourceFolder.reset()
              continue
            }

            const elementFolder = await resourceFolder.readElementFolder()
            for (const elementFile of elementFolder || []) {
              if (uri.toString() === elementFile.getUri().toString()) {
                await elementFile.reset()
                continue
              }
            }
          }
        }
      }
    }
  }
}
