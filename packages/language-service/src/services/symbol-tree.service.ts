import type { LanguageServicePlugin } from '@volar/language-server'
import type { ArkTSExtraLanguageService } from '../language-service'
import { URI } from 'vscode-uri'

export interface TSProvider {
  'typescript/languageService'(): import('ohos-typescript').LanguageService
}

export function createETSSymbolTreeService(arktsExtraLanguageService: ArkTSExtraLanguageService): LanguageServicePlugin {
  return {
    name: 'arkts-navigation-tree',
    capabilities: {
      documentSymbolProvider: true,
    },
    create(context) {
      return {
        provideDocumentSymbols(document) {
          const languageService = context.inject<TSProvider>('typescript/languageService')
          if (!languageService)
            return []
          const decodeDocumentUri = context.decodeEmbeddedDocumentUri(URI.parse(document.uri))
          if (!decodeDocumentUri)
            return []
          const [documentUri] = decodeDocumentUri
          if (documentUri.fsPath.endsWith('.json') || documentUri.fsPath.endsWith('.json5') || documentUri.fsPath.endsWith('.jsonc'))
            return []
          const navigationBarItems = languageService.getNavigationTree(documentUri.fsPath)
          return navigationBarItems.childItems?.map(item => arktsExtraLanguageService.getSymbolTree(item, document))
            .filter(item => item !== undefined) || []
        },
      }
    },
  }
}
