import type { LanguageServerConfigurator } from '@arkts/shared'
import type { LanguageServicePlugin } from '@volar/language-server'
import type { ProjectDetectorManager } from '../interfaces/project-detector-manager'
import { GlobalCallExpressionFinder } from '../classes/global-call-finder'
import { ResourceProvider } from '../classes/resource-provider'
import { ContextUtil } from '../utils/context-util'

export function createArkTSResource(projectDetectorManager: ProjectDetectorManager, ets: typeof import('ohos-typescript'), config: LanguageServerConfigurator): LanguageServicePlugin {
  return {
    name: 'arkts-resource',
    capabilities: {
      completionProvider: {
        triggerCharacters: ['.', '\'', '"', '`', ':', '$', '/'],
        resolveProvider: false,
      },
      diagnosticProvider: {
        interFileDependencies: true,
        workspaceDiagnostics: true,
      },
      definitionProvider: true,
      documentLinkProvider: {
        resolveProvider: true,
      },
    },
    create(context) {
      const contextUtil = new ContextUtil(context)
      const globalCallFinder = new GlobalCallExpressionFinder(ets)
      const resourceProvider = ResourceProvider.create(contextUtil, globalCallFinder, projectDetectorManager, config, ets)

      return {
        provideDiagnostics(document, token) {
          return resourceProvider.getDiagnosticProvider().provideDiagnostics(document, token)
        },

        async provideCompletionItems(document, position, ctx, token) {
          return resourceProvider.getCompletionProvider().provideCompletionItems(document, position, ctx, token)
        },

        provideDefinition(document, position, token) {
          return resourceProvider.getDefinitionProvider().provideDefinition(document, position, token)
        },

        provideDocumentLinks(document, token) {
          return resourceProvider.getDocumentLinkProvider().provideDocumentLinks(document, token)
        },

        provideHover(document, position, token) {
          return resourceProvider.getHoverProvider().provideHover(document, position, token)
        },
      }
    },
  }
}
