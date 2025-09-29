import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { Range } from 'vscode-languageserver-types'
import type { FullableReference } from '../../interfaces/common'
import type { File } from '../../interfaces/file-system/file-system'
import { ReferenceImpl } from './reference'

export abstract class FullableReferenceImpl extends ReferenceImpl implements FullableReference {
  constructor(
    protected readonly file: File,
    protected readonly range: Range,
    protected readonly text: string,
    protected readonly textDocument: TextDocument,
  ) { super(file, range, text, textDocument) }

  getFullRange(): Range {
    return this.range
  }

  getFullText(): string {
    return this.text
  }

  abstract getRange(): Range
  abstract getText(): string
}
