import type { LanguageServicePlugin } from '@volar/language-server'
import type { CompletionList } from 'vscode-languageserver-protocol'
import type { Position, TextDocument } from 'vscode-languageserver-textdocument'
import { ContextUtil } from '../utils/context-util'

export function createETSResourceService(): LanguageServicePlugin {
  return {
    name: 'arkts-resource',
    capabilities: {
      completionProvider: {
        triggerCharacters: ['.', '`', '\'', '"'],
        resolveProvider: false,
      },
    },
    create(context) {
      const contextUtil = new ContextUtil(context)

      return {
        async provideCompletionItems(document: TextDocument, _position: Position): Promise<CompletionList | null> {
          const sourceFile = contextUtil.decodeSourceFile(document)
          if (!sourceFile)
            return null

          return null
        },
      }
    },
  }
}
