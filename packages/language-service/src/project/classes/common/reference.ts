import type { Range, TextDocument } from 'vscode-languageserver-textdocument'
import type { Reference } from '../../interfaces/common'
import type { File } from '../../interfaces/file-system/file-system'
import { Cacheable } from './cacheable'

export abstract class ReferenceImpl extends Cacheable implements Reference {
  constructor(
    protected readonly file: File,
    protected readonly range: Range,
    protected readonly text: string,
    protected readonly textDocument: TextDocument,
  ) { super() }

  getFile(): File {
    return this.file
  }

  getRange(): Range {
    return this.range
  }

  getText(): string {
    return this.text
  }

  getTextDocument(): TextDocument {
    return this.textDocument
  }
}
