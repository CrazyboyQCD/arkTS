import type { LanguageServerLogger } from '@arkts/shared'
import type { LanguageServicePlugin } from '@volar/language-server'
import { Range } from '@volar/language-server'
import { ContextUtil } from '../utils/finder'

export function createETSLinterDiagnosticService(ets: typeof import('ohos-typescript'), logger: LanguageServerLogger): LanguageServicePlugin {
  let builderProgram: import('ohos-typescript').EmitAndSemanticDiagnosticsBuilderProgram | undefined

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
          if (!builderProgram) {
            builderProgram = ets.createIncrementalProgramForArkTs({
              rootNames: languageService.getProgram()?.getRootFileNames() ?? [],
              options: languageService.getProgram()?.getCompilerOptions() ?? {},
            })
          }

          try {
            return [
              ...ets.ArkTSLinter_1_0.runArkTSLinter(builderProgram, sourceFile, undefined, 'ArkTS_1_0'),
              ...ets.ArkTSLinter_1_1.runArkTSLinter(builderProgram, sourceFile, undefined, 'ArkTS_1_1'),
            ].filter(tsDiagnostic => tsDiagnostic.start !== undefined && tsDiagnostic.length !== undefined).map(
              tsDiagnostic => ({
                code: tsDiagnostic.code,
                range: Range.create(
                  document.positionAt(tsDiagnostic.start!),
                  document.positionAt(tsDiagnostic.start! + tsDiagnostic.length!),
                ),
                message: typeof tsDiagnostic.messageText === 'string'
                  ? tsDiagnostic.messageText
                  : tsDiagnostic.messageText.messageText,
              }),
            )
          }
          catch (error) {
            logger.getConsola().error(`ArkTS Linter error: `)
            console.error(error)
            return []
          }
        },
      }
    },
  }
}
