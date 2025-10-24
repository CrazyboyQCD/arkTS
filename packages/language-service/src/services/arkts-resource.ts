import type { LanguageServerConfigurator } from '@arkts/shared'
import type { CompletionItem, Diagnostic, LanguageServicePlugin } from '@volar/language-server'
import type { ProjectDetectorManager } from '../interfaces/project-detector-manager'
import { CompletionItemKind, DiagnosticSeverity, Position, Range, TextDocument } from '@volar/language-server'
import { GlobalCallExpressionFinder } from '../classes/global-call-finder'
import { SysResource } from '../interfaces/sys-resource'
import { ContextUtil } from '../utils/context-util'

export async function createArkTSResource(projectDetectorManager: ProjectDetectorManager, ets: typeof import('ohos-typescript'), config: LanguageServerConfigurator): Promise<LanguageServicePlugin> {
  return {
    name: 'arkts-resource',
    capabilities: {
      completionProvider: {
        triggerCharacters: ['.', '\'', '"', '`'],
        resolveProvider: false,
      },
      diagnosticProvider: {
        interFileDependencies: true,
        workspaceDiagnostics: true,
      },
    },
    create(context) {
      const contextUtil = new ContextUtil(context)
      const globalCallFinder = new GlobalCallExpressionFinder(ets)

      return {
        provideDiagnostics(document) {
          const decodedUri = contextUtil.decodeTextDocumentUri(document)
          if (!decodedUri) return null
          const sourceFile = contextUtil.decodeSourceFile(document)
          if (!sourceFile) return null
          const resourceCallExpressions = globalCallFinder.findGlobalCallExpression(sourceFile, '$r')
          if (resourceCallExpressions.length === 0) return null

          const diagnostics: Diagnostic[] = []

          for (const resourceCallExpression of resourceCallExpressions) {
            const resourceValue = globalCallFinder.getFirstArgumentText(resourceCallExpression, sourceFile)
            if (!resourceValue) continue

            // 系统资源诊断
            if (resourceValue.startsWith('sys')) {
              const sysResource = config.getSysResource()
              const sysEtsFormats = sysResource ? SysResource.toEtsFormat(sysResource) : []
              if (!sysResource) continue
              if (!sysEtsFormats.includes(resourceValue)) {
                diagnostics.push({
                  message: `Sys resource ${resourceValue} not found in current scope.`,
                  range: Range.create(
                    document.positionAt(resourceCallExpression.getStart(sourceFile)),
                    document.positionAt(resourceCallExpression.getEnd()),
                  ),
                  severity: DiagnosticSeverity.Error,
                  code: 'SYS_RESOURCE_NOT_FOUND',
                  source: 'ets',
                })
              }
              continue
            }

            // 本地资源诊断
            const references = projectDetectorManager.findByUri(decodedUri.toString())
              ?.findByUri(decodedUri.toString())
              ?.findByUri(decodedUri.toString())
              ?.findByUri(decodedUri.toString())
              ?.findElementReference() ?? []
            const reference = references.find(reference => reference.getUnderlyingElementJsonFileReference().toEtsFormat() === resourceValue)
            if (reference) continue
            diagnostics.push({
              message: `Resource ${resourceValue} not found in current scope.`,
              range: Range.create(
                document.positionAt(resourceCallExpression.getStart(sourceFile)),
                document.positionAt(resourceCallExpression.getEnd()),
              ),
              severity: DiagnosticSeverity.Error,
              code: 'RESOURCE_NOT_FOUND',
              source: 'ets',
            })
          }

          return diagnostics
        },

        provideCompletionItems(document, position) {
          const decodedUri = contextUtil.decodeTextDocumentUri(document)
          if (!decodedUri) return null
          const sourceFile = contextUtil.decodeSourceFile(document)
          if (!sourceFile) return null
          const resourceCallExpressions = globalCallFinder.findGlobalCallExpression(sourceFile, '$r')
          if (resourceCallExpressions.length === 0) return null
          const currentCallExpression = globalCallFinder.isInCallExpression(resourceCallExpressions, sourceFile, document, position)
          if (!currentCallExpression) return null
          const firstArgumentText = globalCallFinder.getFirstArgumentText(currentCallExpression, sourceFile) ?? ''
          const sysResource = config.getSysResource()
          const sysEtsFormats = sysResource ? SysResource.toEtsFormat(sysResource) : []
          const elementReferences = projectDetectorManager.findByUri(decodedUri.toString())
            ?.findByUri(decodedUri.toString())
            ?.findByUri(decodedUri.toString())
            ?.findByUri(decodedUri.toString())
            ?.findElementReference() ?? []
          const etsFormats = [...new Set(elementReferences.map(reference => reference.getUnderlyingElementJsonFileReference().toEtsFormat()))]
          const items: CompletionItem[] = []

          if (!firstArgumentText.startsWith('app')) {
            for (const sysEtsFormat of sysEtsFormats) {
              const spilted = sysEtsFormat.split(firstArgumentText)
              if (spilted.length < 2) continue
              items.push({
                label: sysEtsFormat,
                kind: CompletionItemKind.Value,
                detail: sysEtsFormat,
                insertText: firstArgumentText ? spilted[1] : sysEtsFormat,
              })
            }
          }

          if (!firstArgumentText.startsWith('sys')) {
            for (const etsFormat of etsFormats) {
              const spilted = etsFormat.split(firstArgumentText)
              if (spilted.length < 2) continue

              items.push({
                label: etsFormat,
                kind: CompletionItemKind.Value,
                detail: etsFormat,
                insertText: firstArgumentText ? spilted[1] : etsFormat,
              })
            }
          }

          return {
            items,
            isIncomplete: false,
          }
        },

        provideDefinition(document, position) {
          const decodedUri = contextUtil.decodeTextDocumentUri(document)
          if (!decodedUri) return null
          const sourceFile = contextUtil.decodeSourceFile(document)
          if (!sourceFile) return null
          const resourceCallExpressions = globalCallFinder.findGlobalCallExpression(sourceFile, '$r')
          if (resourceCallExpressions.length === 0) return null
          const currentCallExpression = globalCallFinder.isInCallExpression(resourceCallExpressions, sourceFile, document, position)
          if (!currentCallExpression) return null
          const firstArgumentText = globalCallFinder.getFirstArgumentText(currentCallExpression, sourceFile) ?? ''
          const [scope, type, name] = firstArgumentText.split('.')
          if (!scope || !type || !name) return null
          if (scope === 'sys') {
            return [{
              targetUri: config.getSysResourcePath(),
              targetRange: Range.create(
                Position.create(0, 0),
                Position.create(0, 0),
              ),
              targetSelectionRange: Range.create(
                Position.create(0, 0),
                Position.create(0, 0),
              ),
              originSelectionRange: Range.create(
                document.positionAt(currentCallExpression.arguments[0].getStart(sourceFile) + 1),
                document.positionAt(currentCallExpression.arguments[0].getEnd() - 1),
              ),
            }]
          }

          if (scope === 'app') {
            const elementReferences = projectDetectorManager.findByUri(decodedUri.toString())
              ?.findByUri(decodedUri.toString())
              ?.findByUri(decodedUri.toString())
              ?.findByUri(decodedUri.toString())
              ?.findElementReference() ?? []

            return elementReferences
              .filter(reference => reference.getUnderlyingElementJsonFileReference().toEtsFormat() === firstArgumentText)
              .map((reference) => {
                const elementJsonFile = reference.getElementJsonFile().getUnderlyingElementJsonFile()
                const content = elementJsonFile.getContent()
                const textDocument = TextDocument.create(elementJsonFile.getUri().toString(), 'json', 0, content)

                return {
                  targetUri: elementJsonFile.getUri().toString(),
                  targetRange: Range.create(
                    textDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameStart() + 1),
                    textDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameEnd() - 1),
                  ),
                  targetSelectionRange: Range.create(
                    textDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameStart() + 1),
                    textDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameEnd() - 1),
                  ),
                  originSelectionRange: Range.create(
                    document.positionAt(currentCallExpression.arguments[0].getStart(sourceFile) + 1),
                    document.positionAt(currentCallExpression.arguments[0].getEnd() - 1),
                  ),
                }
              })
          }

          return []
        },
      }
    },
  }
}
