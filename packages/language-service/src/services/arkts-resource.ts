import type { LanguageServerConfigurator } from '@arkts/shared'
import type { CompletionItem, Diagnostic, LanguageServiceContext, LanguageServicePlugin, LocationLink } from '@volar/language-server'
import type * as ets from 'ohos-typescript'
import type { ProjectDetectorManager } from '../interfaces/project-detector-manager'
import { CompletionItemKind, DiagnosticSeverity, Position, Range, TextDocument } from '@volar/language-server'
import { URI } from 'vscode-uri'
import { GlobalCallExpressionFinder } from '../classes/global-call-finder'
import { ElementJsonFileReference } from '../interfaces/element-json-file-reference'
import { SysResource } from '../interfaces/sys-resource'
import { ContextUtil } from '../utils/context-util'
import { LEADING_TRAILING_QUOTE_REGEX } from '../utils/regex'

interface DefinitionProvider {
  provideJsonDefinition(): Promise<LocationLink[] | null>
  provideArktsDefinition(): LocationLink[] | null
}

interface CompletionProvider {
  provideModuleJson5Completion(): CompletionItem[]
  provideArktsCompletion(): CompletionItem[]
}

export function createArkTSResource(projectDetectorManager: ProjectDetectorManager, ets: typeof import('ohos-typescript'), config: LanguageServerConfigurator): LanguageServicePlugin {
  const emptyRange = Range.create(
    Position.create(0, 0),
    Position.create(0, 0),
  )
  function createDefinitionProvider(ctx: LanguageServiceContext, document: TextDocument, position: Position, decodedUri: URI, contextUtil: ContextUtil, globalCallFinder: GlobalCallExpressionFinder): DefinitionProvider {
    /** element json file -- jump to --> arkts/module.json5 */
    async function findLocationLinkInElementJsonFile(): Promise<LocationLink[]> {
      const product = projectDetectorManager.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
      if (!product) return []
      const references = product.findElementReference()
      if (!references.length) return []
      const currentElementJsonFileReference = references.find((reference) => {
        const underlyingReference = reference.getUnderlyingElementJsonFileReference()
        const underlyingJsonFile = reference.getElementJsonFile().getUnderlyingElementJsonFile()
        const underlyingJsonFileUri = underlyingJsonFile.getUri()
        if (underlyingJsonFileUri.toString() !== decodedUri.toString()) return false
        const positionStart = document.positionAt(underlyingReference.getNameStart())
        const positionEnd = document.positionAt(underlyingReference.getNameEnd())
        return positionStart.line <= position.line && positionEnd.line >= position.line && positionStart.character <= position.character && positionEnd.character >= position.character
      })
      if (!currentElementJsonFileReference) return []

      const definitions: LocationLink[] = []
      const currentUnderlyingElementJsonFileReference = currentElementJsonFileReference.getUnderlyingElementJsonFileReference()
      const originSelectionRange = Range.create(
        document.positionAt(currentUnderlyingElementJsonFileReference.getNameStart() + 1),
        document.positionAt(currentUnderlyingElementJsonFileReference.getNameEnd() - 1),
      )

      // jump to same level but not same resource qualified directory element json file
      for (const reference of references) {
        if (reference.toEtsFormat() !== currentUnderlyingElementJsonFileReference.toEtsFormat()) continue
        // If the same element json file, skip
        if (reference.getUri().toString() === decodedUri.toString()) continue
        const jsonTextDocument = TextDocument.create(reference.getUri().toString(), 'json', 0, reference.getElementJsonFile().getUnderlyingElementJsonFile().getContent())
        const targetRange = Range.create(
          jsonTextDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameStart() + 1),
          jsonTextDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameEnd() - 1),
        )
        definitions.push({
          targetUri: reference.getUri().toString(),
          targetRange,
          targetSelectionRange: targetRange,
          originSelectionRange,
        })
      }

      // jump to arkts file
      const sourceFiles = contextUtil.getLanguageService()?.getProgram()?.getSourceFiles() ?? []
      const callExpressions = sourceFiles.flatMap(sourceFile => globalCallFinder.findGlobalCallExpression(sourceFile, '$r'))

      for (const callExpression of callExpressions) {
        const firstArgumentText = globalCallFinder.getFirstArgumentText(callExpression)
        if (!firstArgumentText) continue
        if (firstArgumentText !== currentUnderlyingElementJsonFileReference.toEtsFormat()) continue
        const sourceFile = callExpression.getSourceFile()
        const etsTextDocument = TextDocument.create(sourceFile.fileName, 'typescript', 0, sourceFile.getText())
        const targetRange = Range.create(
          etsTextDocument.positionAt(callExpression.arguments[0].getStart(sourceFile) + 1),
          etsTextDocument.positionAt(callExpression.arguments[0].getEnd() - 1),
        )

        definitions.push({
          targetUri: sourceFile.fileName,
          targetRange,
          targetSelectionRange: targetRange,
          originSelectionRange,
        })
      }

      // jump to module.json5
      const moduleJson5Path = product?.getUnderlyingProduct().getModuleJson5Path()
      if (!moduleJson5Path) return definitions
      const moduleJson5Content = await ctx.env.fs?.readFile(URI.parse(moduleJson5Path.toString())) ?? ''
      if (!moduleJson5Content) return definitions
      const sourceFile = ets.parseJsonText(moduleJson5Path.toString(), moduleJson5Content)
      const stringLiterals: ets.StringLiteral[] = []
      sourceFile.forEachChild(function walk(node: ets.Node): void {
        if (!ets.isStringLiteral(node)) return node.forEachChild(walk)
        if (node.getText(sourceFile).replace(LEADING_TRAILING_QUOTE_REGEX, '') !== currentUnderlyingElementJsonFileReference.toJsonFormat()) return node.forEachChild(walk)
        stringLiterals.push(node)
        return node.forEachChild(walk)
      })
      if (stringLiterals.length === 0) return definitions
      const moduleJson5TextDocument = TextDocument.create(moduleJson5Path.toString(), 'json', 0, moduleJson5Content)
      for (const stringLiteral of stringLiterals) {
        const targetRange = Range.create(
          moduleJson5TextDocument.positionAt(stringLiteral.getStart(sourceFile) + 1),
          moduleJson5TextDocument.positionAt(stringLiteral.getEnd() - 1),
        )
        definitions.push({
          targetUri: moduleJson5Path.toString(),
          targetRange,
          targetSelectionRange: targetRange,
          originSelectionRange,
        })
      }

      return definitions
    }

    /** module.json5 -- jump to --> element json file, media directory, profile directory */
    async function findLocationLinkInModuleJson5(): Promise<LocationLink[]> {
      const product = projectDetectorManager.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
      if (!product) return []
      const moduleJson5Path = product.getUnderlyingProduct()?.getModuleJson5Path()
      if (!moduleJson5Path) return []
      if (moduleJson5Path.toString() !== decodedUri.toString()) return []
      const content = document.getText()
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
      const originSelectionRange = Range.create(
        document.positionAt(currentStringLiteral.getStart(sourceFile) + 1),
        document.positionAt(currentStringLiteral.getEnd() - 1),
      )

      const definitions: LocationLink[] = []
      const references = product.findReference()

      for (const reference of references) {
        if (reference.toJsonFormat() !== currentStringLiteral.getText(sourceFile).replace(LEADING_TRAILING_QUOTE_REGEX, '')) continue

        if (ElementJsonFileReference.is(reference)) {
          const elementJsonFile = reference.getElementJsonFile().getUnderlyingElementJsonFile()
          const content = elementJsonFile.getContent()
          const textDocument = TextDocument.create(elementJsonFile.getUri().toString(), 'json', 0, content)
          const targetRange = Range.create(
            textDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameStart() + 1),
            textDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameEnd() - 1),
          )
          definitions.push({
            targetUri: elementJsonFile.getUri().toString(),
            targetRange,
            targetSelectionRange: targetRange,
            originSelectionRange,
          })
        }
        else {
          definitions.push({
            targetUri: reference.getUri().toString(),
            targetRange: emptyRange,
            targetSelectionRange: emptyRange,
            originSelectionRange,
          })
        }
      }

      return definitions
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
          targetRange: emptyRange,
          targetSelectionRange: emptyRange,
          originSelectionRange: Range.create(
            document.positionAt(currentCallExpression.arguments[0].getStart(sourceFile) + 1),
            document.positionAt(currentCallExpression.arguments[0].getEnd() - 1),
          ),
        }]
      }

      if (scope === 'app') {
        const definitions: LocationLink[] = []
        const product = projectDetectorManager.findByUri(decodedUri.toString())
          ?.findByUri(decodedUri.toString())
          ?.findByUri(decodedUri.toString())
          ?.findByUri(decodedUri.toString())
        if (!product) return null

        const references = product.findReference()
        if (!references.length) return null
        const originSelectionRange = Range.create(
          document.positionAt(currentCallExpression.arguments[0].getStart(sourceFile) + 1),
          document.positionAt(currentCallExpression.arguments[0].getEnd() - 1),
        )

        for (const reference of references) {
          if (reference.toEtsFormat() !== firstArgumentText) continue
          const uri = reference.getUri()

          if (ElementJsonFileReference.is(reference)) {
            const content = reference.getElementJsonFile().getUnderlyingElementJsonFile().getContent()
            const textDocument = TextDocument.create(uri.toString(), 'json', 0, content)
            definitions.push({
              targetUri: uri.toString(),
              targetRange: Range.create(
                textDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameStart() + 1),
                textDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameEnd() - 1),
              ),
              targetSelectionRange: Range.create(
                textDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameStart() + 1),
                textDocument.positionAt(reference.getUnderlyingElementJsonFileReference().getNameEnd() - 1),
              ),
              originSelectionRange,
            })
          }
          else {
            definitions.push({
              targetUri: uri.toString(),
              targetRange: emptyRange,
              targetSelectionRange: emptyRange,
              originSelectionRange,
            })
          }
        }

        return definitions
      }

      return []
    }

    return {
      provideJsonDefinition: async () => await Promise.all([
        findLocationLinkInElementJsonFile(),
        findLocationLinkInModuleJson5(),
      ]).then(results => results.flat()),
      provideArktsDefinition,
    }
  }

  function createCompletionProvider(document: TextDocument, position: Position, decodedUri: URI, contextUtil: ContextUtil, globalCallFinder: GlobalCallExpressionFinder, triggerCharacter: string | undefined): CompletionProvider {
    function provideModuleJson5Completion(): CompletionItem[] {
      const products = projectDetectorManager.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findAll() ?? []
      const currentProduct = products.find(product => product.getUnderlyingProduct().getModuleJson5Path().toString() === decodedUri.toString())
      const moduleJson5Path = currentProduct?.getUnderlyingProduct().getModuleJson5Path()
      if (!currentProduct || !moduleJson5Path) return []
      const sourceFile = ets.parseJsonText(moduleJson5Path.toString(), document.getText())
      const stringLiterals: ets.StringLiteral[] = []
      sourceFile.forEachChild(function walk(node: ets.Node): void {
        if (!ets.isStringLiteral(node)) return node.forEachChild(walk)
        stringLiterals.push(node)
        return node.forEachChild(walk)
      })
      const currentStringLiteral = stringLiterals.find((stringLiteral) => {
        const startPosition = document.positionAt(stringLiteral.getStart(sourceFile))
        const endPosition = document.positionAt(stringLiteral.getEnd())
        return startPosition.line <= position.line && endPosition.line >= position.line
          && startPosition.character <= position.character && endPosition.character >= position.character
      })
      if (!currentStringLiteral) return []
      const stringLiteralText = currentStringLiteral?.getText(sourceFile).replace(LEADING_TRAILING_QUOTE_REGEX, '')
      if (!stringLiteralText) return []

      const items: CompletionItem[] = []
      const uniqueJsonFormats = [...new Set(currentProduct.findReference().map(reference => reference.toJsonFormat()))]
      for (const jsonFormat of uniqueJsonFormats) {
        if (!jsonFormat.startsWith(stringLiteralText)) continue
        const spilted = jsonFormat.split(stringLiteralText)

        items.push({
          label: jsonFormat,
          kind: CompletionItemKind.Value,
          detail: jsonFormat,
          insertText: stringLiteralText ? spilted[1] : jsonFormat,
        })
      }

      return items
    }

    function provideArktsCompletion(): CompletionItem[] {
      if (triggerCharacter === ':' || triggerCharacter === '$') return []
      const sourceFile = contextUtil.decodeSourceFile(document)
      if (!sourceFile) return []
      const resourceCallExpressions = globalCallFinder.findGlobalCallExpression(sourceFile, '$r')
      if (resourceCallExpressions.length === 0) return []
      const currentCallExpression = globalCallFinder.isInCallExpression(resourceCallExpressions, sourceFile, document, position)
      if (!currentCallExpression) return []
      const firstArgumentText = globalCallFinder.getFirstArgumentText(currentCallExpression, sourceFile) ?? ''
      const sysResource = config.getSysResource()
      const sysEtsFormats = sysResource ? SysResource.toEtsFormat(sysResource) : []
      const product = projectDetectorManager.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
        ?.findByUri(decodedUri.toString())
      if (!product) return []

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
        const uniqueEtsFormats = [...new Set(product.findReference().map(reference => reference.toEtsFormat()))]
        for (const etsFormat of uniqueEtsFormats) {
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

      return items
    }

    return {
      provideModuleJson5Completion,
      provideArktsCompletion,
    }
  }

  return {
    name: 'arkts-resource',
    capabilities: {
      completionProvider: {
        triggerCharacters: ['.', '\'', '"', '`', ':', '$'],
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
            const product = projectDetectorManager.findByUri(decodedUri.toString())
              ?.findByUri(decodedUri.toString())
              ?.findByUri(decodedUri.toString())
              ?.findByUri(decodedUri.toString())
            if (!product) continue
            const references = product.findReference()
            if (!references.length) continue
            const reference = references.find(reference => reference.toEtsFormat() === resourceValue)
            if (reference) continue

            diagnostics.push({
              message: `Resource ${resourceValue} not found in current scope. Indexed resources: ${product.findAll().map(resource => resource.getUnderlyingResource().getUri())}`,
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

        async provideCompletionItems(document, position, { triggerCharacter }) {
          const decodedUri = contextUtil.decodeTextDocumentUri(document)
          if (!decodedUri) return null

          const completionProvider = createCompletionProvider(document, position, decodedUri, contextUtil, globalCallFinder, triggerCharacter)

          switch (document.languageId) {
            case 'json':
            case 'jsonc':
              return { items: completionProvider.provideModuleJson5Completion(), isIncomplete: false }
            default:
              return { items: completionProvider.provideArktsCompletion(), isIncomplete: false }
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
