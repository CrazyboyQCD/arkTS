import type { Diagnostic, LanguageServicePlugin } from '@volar/language-server'
import { DiagnosticSeverity, Range, TextDocument } from '@volar/language-server'
import { ContextUtil } from '../utils/context-util'

export function createArkTSLinter(ets: typeof import('ohos-typescript')): LanguageServicePlugin {
  return {
    name: 'arkts-linter',
    capabilities: {
      diagnosticProvider: {
        interFileDependencies: true,
        workspaceDiagnostics: true,
      },
    },
    create(context) {
      const contextUtil = new ContextUtil(context)

      function convertDiagnosticCategoryToSeverity(category: import('ohos-typescript').DiagnosticCategory): DiagnosticSeverity {
        switch (category) {
          case ets.DiagnosticCategory.Error:
            return DiagnosticSeverity.Error
          case ets.DiagnosticCategory.Warning:
            return DiagnosticSeverity.Warning
          case ets.DiagnosticCategory.Suggestion:
            return DiagnosticSeverity.Hint
          default:
            return DiagnosticSeverity.Information
        }
      }

      return {
        provideDiagnostics(document) {
          const languageService = contextUtil.getStandaloneLanguageService(ets)
          const documentUri = contextUtil.decodeTextDocumentUri(document)
          if (!languageService || !documentUri) return []

          // eslint-disable-next-line ts/ban-ts-comment
          // @ts-expect-error
          const incrementalProgram = languageService.getBuilderProgram(true)
          console.warn(incrementalProgram)
          if (!incrementalProgram) return []
          const arktsLinterDiagnostics = ets.ArkTSLinter_1_1.runArkTSLinter(incrementalProgram)
          console.warn(arktsLinterDiagnostics)
          const diagnostics: Diagnostic[] = []

          for (const diagnostic of arktsLinterDiagnostics) {
            if (!diagnostic.file) continue
            if (typeof diagnostic.start !== 'number' || typeof diagnostic.length !== 'number') continue
            if (diagnostic.file.fileName !== documentUri.fsPath) continue
            const textDocument = TextDocument.create(diagnostic.file?.fileName ?? '', 'ets', 0, diagnostic.file?.getText() ?? '')

            diagnostics.push({
              range: Range.create(
                textDocument.positionAt(diagnostic.start),
                textDocument.positionAt(diagnostic.start + diagnostic.length),
              ),
              message: typeof diagnostic.messageText === 'string' ? diagnostic.messageText : diagnostic.messageText.messageText,
              severity: convertDiagnosticCategoryToSeverity(diagnostic.category),
              source: diagnostic.source ?? 'arkts-linter',
              code: diagnostic.code,
            })
          }

          return diagnostics
        },
      }
    },
  }
}
