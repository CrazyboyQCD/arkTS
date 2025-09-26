import type { LanguageServicePlugin } from '@volar/language-server'
import type { CompletionList, Diagnostic, LocationLink, Position } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { ArkTSExtraLanguageService } from '../language-service'
import type { ArkTSExtraLanguageServiceImpl } from '../language-service-impl'
import type { OpenHarmonyProjectDetector } from '../project'
import type { ElementJsonFile } from '../project/project'
import path from 'node:path'
import { typeAssert } from '@arkts/shared'
import { CompletionItemKind, DiagnosticSeverity, MarkupKind, Range } from 'vscode-languageserver-protocol'
import { URI } from 'vscode-uri'
import { ContextUtil } from '../utils/context-util'

export function createETSResourceService(detector: OpenHarmonyProjectDetector, service: ArkTSExtraLanguageService): LanguageServicePlugin {
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

      async function getResourceReference(document: TextDocument): Promise<ElementJsonFile.NameRangeReference[]> {
        const sourceFile = contextUtil.decodeSourceFile(document)
        if (!sourceFile)
          return []
        const project = await detector.searchProject(URI.file(sourceFile.fileName), 'module', detector.getForce())
        if (!project)
          return []
        const openHarmonyModules = await project.readOpenHarmonyModules(detector.getForce())
        const openHarmonyModule = openHarmonyModules.find(openHarmonyModule => URI.file(sourceFile.fileName).toString().startsWith(openHarmonyModule.getModulePath().toString()))
        if (!openHarmonyModule)
          return []
        return openHarmonyModule.groupByResourceReference(ets, detector.getForce())
      }

      async function getModuleJson5SourceFile(document: TextDocument): Promise<import('ohos-typescript').JsonSourceFile | null> {
        const tsSourceFile = contextUtil.decodeSourceFile(document)
        if (!tsSourceFile)
          return null
        const project = await detector.searchProjectByModuleJson5(URI.file(tsSourceFile.fileName), ets, detector.getForce())
        if (!project)
          return null
        const openHarmonyModules = await project.readOpenHarmonyModules(detector.getForce())
        const openHarmonyModule = openHarmonyModules.find(openHarmonyModule => URI.file(tsSourceFile.fileName).toString().startsWith(openHarmonyModule.getModulePath().toString()))
        if (!openHarmonyModule)
          return null
        return ets.parseJsonText(openHarmonyModule.getModuleJson5Path().fsPath, document.getText())
      }

      async function getResourceElementName(document: TextDocument, position: Position): Promise<ElementJsonFile.NameRange | null> {
        const tsSourceFile = contextUtil.decodeSourceFile(document)
        if (!tsSourceFile)
          return null
        const elementJsonFile = await detector.searchResourceElementFile(URI.file(tsSourceFile.fileName), detector.getForce())
        if (!elementJsonFile)
          return null
        const nameRanges = await elementJsonFile.getNameRange(ets, detector.getForce())
        return nameRanges.find(nameRange => nameRange.start.line === position.line && nameRange.start.character <= position.character && nameRange.end.character >= position.character) ?? null
      }

      return {
        async provideDiagnostics(document): Promise<Diagnostic[]> {
          if (document.languageId === 'json')
            return []
          const sourceFile = contextUtil.decodeSourceFile(document)
          if (!sourceFile)
            return []
          const $rCallExpressions = service.get$rCallExpressions(sourceFile, document)
          const resourceReference = await getResourceReference(document)

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

        async provideCompletionItems(document: TextDocument, position: Position, context): Promise<CompletionList | null> {
          if (document.languageId === 'json' || document.languageId === 'jsonc') {
            if (context.triggerCharacter !== ':')
              return null
            const moduleJson5SourceFile = await getModuleJson5SourceFile(document)
            if (!moduleJson5SourceFile)
              return null
            const references = await getResourceReference(document)
            const matchedNode = service.getCurrentPositionNode(moduleJson5SourceFile, document, position, ets.isStringLiteral)
            if (!matchedNode)
              return null
            const matchedNodeText = matchedNode.getText(moduleJson5SourceFile).replace(/^['"]|['"]$/g, '')
            const matchedKind = matchedNodeText.split(':')[0].trim().replace(/^\$/, '')

            return {
              isIncomplete: true,
              items: references
                .filter(reference => reference.references.some(reference => reference.kind === matchedKind))
                .map((reference) => {
                  return {
                    label: reference.name,
                    kind: CompletionItemKind.Reference,
                    documentation: {
                      kind: MarkupKind.Markdown,
                      value: reference.references.map((reference) => {
                        return `- ${reference.kind}: [${path.relative(detector.getWorkspaceFolder().fsPath, reference.uri.fsPath)}](${reference.uri.toString()})`
                      }).join('\n'),
                    },
                  }
                }),
            }
          }
          return null
        },

        async provideDefinition(document, position): Promise<LocationLink[]> {
          if (document.languageId === 'json' || document.languageId === 'jsonc') {
            const locationLinks: LocationLink[] = []
            const moduleJson5SourceFile = await getModuleJson5SourceFile(document)
            // If the module.json5 source file found, return the location links
            if (moduleJson5SourceFile) {
              const moduleJson5ResourceReferences = service.getModuleJson5ResourceReferences(moduleJson5SourceFile, document)
              const matchedModuleJson5ResourceReference = moduleJson5ResourceReferences.find(reference => reference.start.line === position.line && reference.start.character <= position.character && reference.end.character >= position.character)
              if (!matchedModuleJson5ResourceReference)
                return []
              const matchedModuleJson5ResourceRange = await detector.searchResourceElementRange(matchedModuleJson5ResourceReference.kind, matchedModuleJson5ResourceReference.name, ets, detector.getForce())
              if (!matchedModuleJson5ResourceRange)
                return []
              return matchedModuleJson5ResourceRange.map((nameRange): LocationLink => {
                return {
                  targetUri: nameRange.uri.toString(),
                  targetRange: Range.create(
                    nameRange.start,
                    nameRange.end,
                  ),
                  targetSelectionRange: Range.create(
                    nameRange.start,
                    nameRange.end,
                  ),
                  originSelectionRange: Range.create(
                    matchedModuleJson5ResourceReference.start,
                    matchedModuleJson5ResourceReference.end,
                  ),
                }
              })
            }

            // If the other element json file found, return the location links
            const resourceReferences = await getResourceReference(document)
            const matchedNameRange = await getResourceElementName(document, position)
            if (!matchedNameRange)
              return []
            const resourceReference = resourceReferences.find(reference => reference.name === matchedNameRange?.text)?.references ?? []

            for (const reference of resourceReference) {
              locationLinks.push({
                targetUri: reference.uri.toString(),
                targetRange: Range.create(
                  reference.start,
                  reference.end,
                ),
                targetSelectionRange: Range.create(
                  reference.start,
                  reference.end,
                ),
                originSelectionRange: Range.create(
                  matchedNameRange.start,
                  matchedNameRange.end,
                ),
              })
            }

            return locationLinks
          }

          const sourceFile = contextUtil.decodeSourceFile(document)
          if (!sourceFile)
            return []
          const $rCallExpressions = service.get$rCallExpressions(sourceFile, document)
          const resourceReference = await getResourceReference(document)

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
                  targetUri: nameRange.uri.toString(),
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
