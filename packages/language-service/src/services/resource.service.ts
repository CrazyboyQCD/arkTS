import type { LanguageServicePlugin } from '@volar/language-server'
import type { CompletionList, Diagnostic, LocationLink, Position } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { ArkTSExtraLanguageService } from '../language-service'
import type { ArkTSExtraLanguageServiceImpl } from '../language-service-impl'
import type { OpenHarmonyProjectDetector } from '../project'
import { typeAssert } from '@arkts/shared'
import { DiagnosticSeverity, Range } from 'vscode-languageserver-protocol'
import { ContextUtil } from '../utils/context-util'

export function createETSResourceService(service: ArkTSExtraLanguageService, detector: OpenHarmonyProjectDetector): LanguageServicePlugin {
  typeAssert<ArkTSExtraLanguageServiceImpl>(service)
  const ets = service.getETS()

  return {
    name: 'arkts-resource',
    capabilities: {
      diagnosticProvider: {
        interFileDependencies: true,
        workspaceDiagnostics: true,
      },
      definitionProvider: true,
      completionProvider: {
        triggerCharacters: ['.', '"', '\'', '`', ':'],
        resolveProvider: false,
      },
    },
    create(context) {
      const contextUtil = new ContextUtil(context)
      const resourceUtil = contextUtil.getResourceUtil(detector, ets)

      return {
        async provideDiagnostics(document): Promise<Diagnostic[]> {
          if (document.languageId === 'json' || document.languageId === 'jsonc')
            return []
          const sourceFile = contextUtil.decodeSourceFile(document)
          if (!sourceFile)
            return []
          const $rCallExpressions = service.get$rCallExpressions(sourceFile, document)
          const resourceReference = await resourceUtil.getResourceReference(document)

          const diagnostics: Diagnostic[] = []

          for (const $rCallExpression of $rCallExpressions) {
            const [resourceScope, resourceType, resourceName] = $rCallExpression.text.split('.')
            if (!resourceScope || !resourceType || !resourceName)
              continue
            // TODO: support sys resource type
            if (resourceScope !== 'app')
              continue

            const nameRanges = (resourceReference?.find(reference => reference.name === resourceName)?.references ?? []).filter((reference) => {
              return reference.kind === resourceType
            })
            if (!nameRanges.length) {
              diagnostics.push({
                range: Range.create(
                  $rCallExpression.start,
                  $rCallExpression.end,
                ),
                message: `Resource ${resourceName} not found.`,
                severity: DiagnosticSeverity.Error,
                source: 'arkts-resource',
                code: 'ARKTS_RESOURCE_NOT_FOUND',
              })
            }
          }

          return diagnostics
        },

        async provideCompletionItems(document: TextDocument, _position: Position): Promise<CompletionList | null> {
          if (document.languageId === 'json' || document.languageId === 'jsonc')
            return null
          return null
        },

        async provideDefinition(document, position): Promise<LocationLink[]> {
          if (document.languageId === 'json' || document.languageId === 'jsonc')
            return []
          const sourceFile = contextUtil.decodeSourceFile(document)
          if (!sourceFile)
            return []
          const $rCallExpressions = service.get$rCallExpressions(sourceFile, document)
          const resourceReference = await resourceUtil.getResourceReference(document)

          const locationLinks: LocationLink[] = []
          for (const $rCallExpression of $rCallExpressions) {
            if (position.line < $rCallExpression.start.line || position.line > $rCallExpression.end.line || position.character < $rCallExpression.start.character || position.character > $rCallExpression.end.character)
              continue
            const [resourceScope, resourceType, resourceName] = $rCallExpression.text.split('.')
            if (!resourceScope || !resourceType || !resourceName)
              continue
            // TODO: support sys resource type
            if (resourceScope !== 'app')
              continue

            const nameRanges = (resourceReference?.find(reference => reference.name === resourceName)?.references ?? []).filter((reference) => {
              return reference.kind === resourceType
            })
            if (!nameRanges.length)
              continue

            locationLinks.push(
              ...nameRanges.map((nameRange) => {
                return {
                  targetUri: nameRange.getElementJsonFile().getUri().toString(),
                  targetRange: Range.create(
                    nameRange.start,
                    nameRange.end,
                  ),
                  targetSelectionRange: Range.create(
                    nameRange.start,
                    nameRange.end,
                  ),
                  originSelectionRange: Range.create(
                    $rCallExpression.stringStart,
                    $rCallExpression.stringEnd,
                  ),
                }
              }),
            )
          }

          return locationLinks
        },
      }
    },
  }
}
