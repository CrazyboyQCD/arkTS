import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { URI } from 'vscode-uri'
import type { TextDocumentUpdater } from '../../interfaces/project-detector'
import { Cacheable } from './cacheable'

export class TextDocumentUpdaterImpl extends Cacheable implements TextDocumentUpdater {
  private readonly updatedTextDocuments: TextDocument[] = []

  async updateFile(uri: string): Promise<void> {
    for (let i = 0; i < this.updatedTextDocuments.length; i++) {
      const updatedTextDocument = this.updatedTextDocuments[i]
      if (updatedTextDocument.uri === uri) {
        this.updatedTextDocuments.splice(i, 1)
        return
      }
    }
  }

  async updateTextDocument(textDocument: TextDocument): Promise<void> {
    for (let i = 0; i < this.updatedTextDocuments.length; i++) {
      const updatedTextDocument = this.updatedTextDocuments[i]
      if (updatedTextDocument.uri === textDocument.uri) {
        this.updatedTextDocuments[i] = textDocument
        return
      }
    }

    this.updatedTextDocuments.push(textDocument)
  }

  getTextDocumentByUri(uri: string | URI): TextDocument | undefined {
    return this.updatedTextDocuments.find((textDocument) => {
      return typeof uri === 'string'
        ? textDocument.uri === uri
        : (textDocument.uri === uri.toString() || textDocument.uri === uri.fsPath || textDocument.uri === uri.path)
    })
  }
}
