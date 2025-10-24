import type { LanguageServerConfigurator } from '@arkts/shared'
import type { CompletionItem, Diagnostic, LanguageServiceContext, LanguageServicePlugin, LocationLink } from '@volar/language-server'
import type * as ets from 'ohos-typescript'
import type { Product } from '../interfaces'
import type { ElementJsonFileReference } from '../interfaces/element-json-file-reference'
import type { ProjectDetectorManager } from '../interfaces/project-detector-manager'
import { CompletionItemKind, DiagnosticSeverity, Position, Range, TextDocument } from '@volar/language-server'
import { URI } from 'vscode-uri'
import { GlobalCallExpressionFinder } from '../classes/global-call-finder'
import { SysResource } from '../interfaces/sys-resource'
import { ContextUtil } from '../utils/context-util'
import { LEADING_TRAILING_QUOTE_REGEX } from '../utils/regex'

interface DefinitionProvider {
  provideJsonDefinition(): Promise<LocationLink[] | null>
  provideArktsDefinition(): LocationLink[] | null
}

export function createArkTSResource(projectDetectorManager: ProjectDetectorManager, ets: typeof import('ohos-typescript'), config: LanguageServerConfigurator): LanguageServicePlugin {
  function createDefinitionProvider(ctx: LanguageServiceContext, document: TextDocument, position: Position, decodedUri: URI, contextUtil: ContextUtil, globalCallFinder: GlobalCallExpressionFinder): DefinitionProvider {
    function queryElementJsonFileReference(product: Product | undefined = projectDetectorManager.findByUri(decodedUri.toString())
      ?.findByUri(decodedUri.toString())
      ?.findByUri(decodedUri.toString())
      ?.findByUri(decodedUri.toString())): ElementJsonFileReference[] {
      return (product ?? projectDetectorManager.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
      )?.findElementReference() ?? []
    }

    async function findLocationLinkInArkTSAndModuleJson5(): Promise<LocationLink[]> {
      const product = projectDetectorManager.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
      const references = queryElementJsonFileReference(product)
      const reference = references.find((reference) => {
        const underlyingReference = reference.getUnderlyingElementJsonFileReference()
        const underlyingJsonFile = reference.getElementJsonFile().getUnderlyingElementJsonFile()
        const underlyingJsonFileUri = underlyingJsonFile.getUri()
        if (underlyingJsonFileUri.toString() !== decodedUri.toString()) return false
        const positionStart = document.positionAt(underlyingReference.getNameStart())
        const positionEnd = document.positionAt(underlyingReference.getNameEnd())
        return positionStart.line <= position.line && positionEnd.line >= position.line && positionStart.character <= position.character && positionEnd.character >= position.character
      })
      if (!reference) return []

      const definitions: LocationLink[] = []
      const sourceFiles = contextUtil.getLanguageService()
        ?.getProgram()
        ?.getSourceFiles() ?? []
      const callExpressions = sourceFiles.flatMap(sourceFile => globalCallFinder.findGlobalCallExpression(sourceFile, '$r'))
      const underlyingElementJsonFileReference = reference.getUnderlyingElementJsonFileReference()
      const underlyingElementJsonFile = reference.getElementJsonFile().getUnderlyingElementJsonFile()

      for (const callExpression of callExpressions) {
        const firstArgumentText = globalCallFinder.getFirstArgumentText(callExpression)
        if (!firstArgumentText) continue
        if (firstArgumentText !== underlyingElementJsonFileReference.toEtsFormat()) continue
        const sourceFile = callExpression.getSourceFile()
        const etsTextDocument = TextDocument.create(sourceFile.fileName, 'typescript', 0, sourceFile.getText())
        const jsonTextDocument = TextDocument.create(sourceFile.fileName, 'json', 0, underlyingElementJsonFile.getContent())
        definitions.push({
          targetUri: sourceFile.fileName,
          targetRange: Range.create(
            etsTextDocument.positionAt(callExpression.arguments[0].getStart(sourceFile) + 1),
            etsTextDocument.positionAt(callExpression.arguments[0].getEnd() - 1),
          ),
          targetSelectionRange: Range.create(
            etsTextDocument.positionAt(callExpression.arguments[0].getStart(sourceFile) + 1),
            etsTextDocument.positionAt(callExpression.arguments[0].getEnd() - 1),
          ),
          originSelectionRange: Range.create(
            jsonTextDocument.positionAt(underlyingElementJsonFileReference.getNameStart() + 1),
            jsonTextDocument.positionAt(underlyingElementJsonFileReference.getNameEnd() - 1),
          ),
        })
      }

      const moduleJson5Path = product?.getUnderlyingProduct().getModuleJson5Path()
      if (!moduleJson5Path) return definitions
      const moduleJson5Content = await ctx.env.fs?.readFile(URI.parse(moduleJson5Path.toString())) ?? ''
      if (!moduleJson5Content) return definitions
      const sourceFile = ets.parseJsonText(moduleJson5Path.toString(), moduleJson5Content)
      const stringLiterals: ets.StringLiteral[] = []
      sourceFile.forEachChild(function walk(node: ets.Node): void {
        if (!ets.isStringLiteral(node)) return node.forEachChild(walk)
        if (node.getText(sourceFile).replace(LEADING_TRAILING_QUOTE_REGEX, '') !== underlyingElementJsonFileReference.toJsonFormat()) return node.forEachChild(walk)
        stringLiterals.push(node)
        return node.forEachChild(walk)
      })
      if (stringLiterals.length === 0) return definitions
      const jsonTextDocument = TextDocument.create(moduleJson5Path.toString(), 'json', 0, moduleJson5Content)
      for (const stringLiteral of stringLiterals) {
        definitions.push({
          targetUri: moduleJson5Path.toString(),
          targetRange: Range.create(
            jsonTextDocument.positionAt(stringLiteral.getStart(sourceFile) + 1),
            jsonTextDocument.positionAt(stringLiteral.getEnd() - 1),
          ),
          targetSelectionRange: Range.create(
            jsonTextDocument.positionAt(stringLiteral.getStart(sourceFile) + 1),
            jsonTextDocument.positionAt(stringLiteral.getEnd() - 1),
          ),
          originSelectionRange: Range.create(
            document.positionAt(underlyingElementJsonFileReference.getNameStart() + 1),
            document.positionAt(underlyingElementJsonFileReference.getNameEnd() - 1),
          ),
        })
      }

      return definitions
    }

    async function findLocationLinkInModuleJson5(): Promise<LocationLink[]> {
      const moduleJson5Path = projectDetectorManager.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.getUnderlyingProduct()
        ?.getModuleJson5Path()
      if (!moduleJson5Path) return []
      if (moduleJson5Path.toString() !== decodedUri.toString()) return []
      const content = await ctx.env.fs?.readFile(URI.parse(moduleJson5Path.toString())) ?? ''
      const sourceFile = ets.parseJsonText(moduleJson5Path.toString(), content)
      const stringLiterals: ets.StringLiteral[] = []
      sourceFile.forEachChild(function walk(node: ets.Node): void {
        if (!ets.isStringLiteral(node)) return node.forEachChild(walk)
        stringLiterals.push(node)
        return node.forEachChild(walk)
      })
      const currentStringLiteral = stringLiterals.find((stringLiteral) => {
        const startPosition = document.positionAt(stringLiteral.getStart(sourceFile))
        const endPosition = document.positionAt(stringLiteral.getEnd())
        return startPosition.line <= position.line && endPosition.line >= position.line && startPosition.character <= position.character && endPosition.character >= position.character
      })
      if (!currentStringLiteral) return []
      return queryElementJsonFileReference()
        .filter(reference => reference.getUnderlyingElementJsonFileReference().toJsonFormat() === currentStringLiteral.getText(sourceFile).replace(LEADING_TRAILING_QUOTE_REGEX, ''))
        .map((reference) => {
          const elementJsonFile = reference.getElementJsonFile().getUnderlyingElementJsonFile()
          const jsonTextDocument = TextDocument.create(elementJsonFile.getUri().toString(), 'json', 0, elementJsonFile.getContent())
          return {
            targetUri: elementJsonFile.getUri().toString(),
            targetRange: Range.create(
              jsonTextDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameStart() + 1),
              jsonTextDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameEnd() - 1),
            ),
            targetSelectionRange: Range.create(
              jsonTextDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameStart() + 1),
              jsonTextDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameEnd() - 1),
            ),
            originSelectionRange: Range.create(
              document.positionAt(currentStringLiteral.getStart(sourceFile) + 1),
              document.positionAt(currentStringLiteral.getEnd() - 1),
            ),
          }
        })
    }

    function provideArktsDefinition(): LocationLink[] | null {
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
        const references = queryElementJsonFileReference()
        return references
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
    }

    return {
      provideJsonDefinition: async () => [
        ...await Promise.all([
          findLocationLinkInArkTSAndModuleJson5(),
          findLocationLinkInModuleJson5(),
        ]).then(results => results.flat()),
      ],
      provideArktsDefinition,
    }
  }

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
      definitionProvider: true,
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
          const definitionProvider = createDefinitionProvider(context, document, position, decodedUri, contextUtil, globalCallFinder)
          switch (document.languageId) {
            case 'json':
            case 'jsonc':
              return definitionProvider.provideJsonDefinition()
            default:
              return definitionProvider.provideArktsDefinition()
          }
        },
      }
    },
  }
}
