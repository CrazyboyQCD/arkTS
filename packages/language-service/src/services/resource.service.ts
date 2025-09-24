import type { LanguageServicePlugin } from '@volar/language-server'
import type { Diagnostic } from 'vscode-languageserver-protocol'
import type { ArkTSExtraLanguageService } from '../language-service'
import type { OpenHarmonyProjectDetector } from '../project'
import { URI } from 'vscode-uri'
import { ContextUtil } from '../utils/context-util'

export function createETSResourceService(detector: OpenHarmonyProjectDetector, service: ArkTSExtraLanguageService): LanguageServicePlugin {
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
        async provideDiagnostics(document): Promise<Diagnostic[] | null> {
          const sourceFile = contextUtil.decodeSourceFile(document)
          if (!sourceFile)
            return null
          const _$rCallExpressions = service.get$rCallExpressions(sourceFile, document)
          const project = await detector.searchProject(URI.file(document.uri), 'module')
          if (!project)
            return null
          const resourceFolder = await project.readResourceFolder()
          if (!resourceFolder)
            return null

          // TODO

          return null
        },
      }
    },
  }
}
