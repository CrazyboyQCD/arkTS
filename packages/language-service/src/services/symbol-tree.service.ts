import type { LanguageServicePlugin } from '@volar/language-server'
import type { ArkTSExtraLanguageService } from '../language-service'
import { URI } from 'vscode-uri'
import { ContextUtil } from '../utils/context-util'

export interface TSProvider {
  'typescript/languageService'(): import('ohos-typescript').LanguageService
}

export function createETSSymbolTreeService(service: ArkTSExtraLanguageService): LanguageServicePlugin {
  return {
    name: 'arkts-navigation-tree',
    capabilities: {
      documentSymbolProvider: true,
    },
    create(context) {
      const contextUtil = new ContextUtil(context)

      return {
        provideDocumentSymbols(document) {
          const sourceFile = contextUtil.decodeSourceFile(document)
          const documentUri = URI.file(sourceFile?.fileName ?? '')
          if (documentUri.fsPath.endsWith('.json') || documentUri.fsPath.endsWith('.json5') || documentUri.fsPath.endsWith('.jsonc'))
            return []
          const languageService = contextUtil.getLanguageService()
          if (!languageService)
            return []
          const navigationBarItems = languageService.getNavigationTree(documentUri.fsPath)
          return navigationBarItems.childItems?.map(item => service.getSymbolTree(item, document))
            .filter(item => item !== undefined) || []
        },
      }
    },
  }
}
