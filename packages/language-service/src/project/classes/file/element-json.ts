import type { URI } from 'vscode-uri'
import type { DeepPartial } from '../../../types/util'
import type { Element } from '../../interfaces/directory/element'
import type { FileSystemAdapter } from '../../interfaces/file-system/file-system-adapter'
import type { ElementJsonFile } from '../../interfaces/file/element-json'
import type { TextDocumentUpdater } from '../../interfaces/project-detector'
import type { ElementJsonNameReference } from '../../interfaces/reference/element-json-name'
import { ResourceElementFile } from '@arkts/types'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Range } from 'vscode-languageserver-types'
import { LEADING_TRAILING_QUOTE_REGEX } from '../../../utils/regex'
import { ElementJsonNameReferenceImpl } from '../reference/element-json-name'
import { JsonLikeFileImpl } from './json-like-file'

export class ElementJsonFileImpl extends JsonLikeFileImpl<DeepPartial<ResourceElementFile>> implements ElementJsonFile {
  constructor(
    private readonly element: Element,
    private readonly uri: URI,
  ) {
    super()
  }

  getUri(): URI {
    return this.uri
  }

  getFileSystem(): Promise<FileSystemAdapter> {
    return this.element.getFileSystem()
  }

  getTextDocumentUpdater(): TextDocumentUpdater {
    return this.element.getTextDocumentUpdater()
  }

  safeParse(force: boolean = false): Promise<DeepPartial<ResourceElementFile>> {
    return super.safeParse(force) as Promise<DeepPartial<ResourceElementFile>>
  }

  getElement(): Element {
    return this.element
  }

  async getNameReferences(ets: typeof import('ohos-typescript/lib/typescript'), force?: boolean): Promise<ElementJsonNameReference[]> {
    return super.computedAsync('getNameReferences', async () => {
      const sourceFile = await this.getSourceFile(ets, force)
      const textDocument = TextDocument.create(this.getUri().toString(), 'json', 0, sourceFile.getText())
      const nameReferences: ElementJsonNameReference[] = []

      for (const statement of sourceFile.statements) {
        if (!ets.isObjectLiteralExpression(statement.expression)) continue

        for (const property of statement.expression.properties) {
          if (!ets.isPropertyAssignment(property)) continue

          if (!ets.isArrayLiteralExpression(property.initializer)) continue

          const kind = property.name.getText(sourceFile).replace(LEADING_TRAILING_QUOTE_REGEX, '')
          if (!ResourceElementFile.Kind.is(kind)) continue

          for (const element of property.initializer.elements) {
            if (!ets.isObjectLiteralExpression(element)) continue

            const nameProperty = element.properties.find(p => p.name?.getText(sourceFile).replace(LEADING_TRAILING_QUOTE_REGEX, '') === 'name')
            if (!nameProperty || !ets.isPropertyAssignment(nameProperty)) continue

            const reference = new ElementJsonNameReferenceImpl(
              this,
              Range.create(
                textDocument.positionAt(nameProperty.initializer.getStart(sourceFile)),
                textDocument.positionAt(nameProperty.initializer.getEnd()),
              ),
              nameProperty.initializer.getText(sourceFile),
              textDocument,
              kind,
            )
            nameReferences.push(reference)
          }
        }
      }

      return nameReferences
    }, force)
  }
}
