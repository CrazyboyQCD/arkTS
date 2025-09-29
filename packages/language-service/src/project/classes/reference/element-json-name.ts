import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { File } from '../../interfaces/file-system/file-system'
import type { ElementJsonFile } from '../../interfaces/file/element-json'
import type { ElementJsonNameReference } from '../../interfaces/reference/element-json-name'
import { Range } from 'vscode-languageserver-types'
import { LEADING_TRAILING_QUOTE_REGEX } from '../../../utils/regex'
import { FullableReferenceImpl } from '../common/fullable-reference'

export class ElementJsonNameReferenceImpl extends FullableReferenceImpl implements ElementJsonNameReference {
  constructor(
    protected readonly file: File,
    protected readonly range: Range,
    protected readonly text: string,
    protected readonly textDocument: TextDocument,
    protected readonly kind: string,
  ) {
    super(file, range, text, textDocument)
  }

  getFile(): ElementJsonFile {
    return this.file as ElementJsonFile
  }

  getKind(): string {
    return this.kind
  }

  override getText(): string {
    return this.text.replace(LEADING_TRAILING_QUOTE_REGEX, '')
  }

  override getRange(): Range {
    return super.computedSync('getRange', () => (
      Range.create(
        this.textDocument.positionAt(this.range.start.character + 1),
        this.textDocument.positionAt(this.range.end.character - 1),
      )
    ))
  }
}
