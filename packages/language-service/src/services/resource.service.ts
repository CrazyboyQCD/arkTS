import type { LanguageServicePlugin } from '@volar/language-server'
import type { CompletionList, Diagnostic, LocationLink } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { ArkTSExtraLanguageService } from '../language-service'
import type { ArkTSExtraLanguageServiceImpl } from '../language-service-impl'
import type { OpenHarmonyProjectDetector } from '../project'
import { typeAssert } from '@arkts/shared'
import { DiagnosticSeverity, Position, Range } from 'vscode-languageserver-protocol'
import { ElementJsonFile } from '../project'
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

            const matchedReference = resourceReference.find(reference => reference.getReferencePath() === $rCallExpression.text)
            if (!matchedReference) {
              diagnostics.push({
                range: Range.create(
                  $rCallExpression.start,
                  $rCallExpression.end,
                ),
                message: `Resource ${$rCallExpression.text} not found.`,
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

            const matchedReferences = resourceReference.filter(reference => reference.getReferencePath() === $rCallExpression.text)
            if (!matchedReferences.length)
              continue

            for (const matchedReference of matchedReferences) {
              if (ElementJsonFile.isNameRangeReference(matchedReference)) {
                for (const reference of matchedReference.references) {
                  locationLinks.push({
                    targetUri: reference.getElementJsonFile().getUri().toString(),
                    targetRange: Range.create(
                      reference.getStart(),
                      reference.getEnd(),
                    ),
                    targetSelectionRange: Range.create(
                      reference.getStart(),
                      reference.getEnd(),
                    ),
                    originSelectionRange: Range.create(
                      $rCallExpression.stringStart,
                      $rCallExpression.stringEnd,
                    ),
                  })
                }
              }
              else {
                const targetRange = Range.create(
                  Position.create(0, 0),
                  Position.create(0, 0),
                )

                locationLinks.push({
                  targetUri: matchedReference.getUri().toString(),
                  targetRange,
                  targetSelectionRange: targetRange,
                  originSelectionRange: Range.create(
                    $rCallExpression.stringStart,
                    $rCallExpression.stringEnd,
                  ),
                })
              }
            }
          }

          return locationLinks
        },
      }
    },
  }
}
