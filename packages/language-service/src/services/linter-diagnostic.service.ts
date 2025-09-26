import type { LanguageServicePlugin } from '@volar/language-server'
import type { ArkTSExtraLanguageService } from '../language-service'
import type { ArkTSExtraLanguageServiceImpl } from '../language-service-impl'
import { typeAssert } from '@arkts/shared'
import { Range } from '@volar/language-server'
import { ContextUtil } from '../utils/context-util'

export function createETSLinterDiagnosticService(service: ArkTSExtraLanguageService): LanguageServicePlugin {
  typeAssert<ArkTSExtraLanguageServiceImpl>(service)
  const ets = service.getETS()

  return {
    name: 'arkts-diagnostic',
    capabilities: {
      diagnosticProvider: {
        interFileDependencies: true,
        workspaceDiagnostics: true,
      },
    },
    create(context) {
      return {
        provideDiagnostics(document) {
          const ctx = new ContextUtil(context)
          const sourceFile = ctx.decodeSourceFile(document)
          const languageService = ctx.getLanguageService()
          if (!sourceFile || !languageService)
            return []
          const builderProgram = service.getBuilderProgram(languageService)

          try {
            return [
              ...ets.ArkTSLinter_1_0.runArkTSLinter(builderProgram, sourceFile, undefined, 'ArkTS_1_0'),
              ...ets.ArkTSLinter_1_1.runArkTSLinter(builderProgram, sourceFile, undefined, 'ArkTS_1_1'),
            ]
              .filter(tsDiagnostic => tsDiagnostic.start !== undefined && tsDiagnostic.length !== undefined)
              .map(tsDiagnostic => ({
                code: tsDiagnostic.code,
                range: Range.create(
                  document.positionAt(tsDiagnostic.start!),
                  document.positionAt(tsDiagnostic.start! + tsDiagnostic.length!),
                ),
                message: typeof tsDiagnostic.messageText === 'string'
                  ? tsDiagnostic.messageText
                  : tsDiagnostic.messageText.messageText,
              }))
          }
          catch (error) {
            console.error(`ArkTS Linter error: `)
            console.error(error)
            return []
          }
        },
      }
    },
  }
}
