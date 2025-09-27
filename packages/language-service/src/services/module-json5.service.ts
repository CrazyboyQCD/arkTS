import type { CompletionList, Diagnostic, Hover, LanguageServicePlugin, LocationLink } from '@volar/language-server'
import type { CompletionItem } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { ArkTSExtraLanguageService, ModuleJson5ResourceReference } from '../language-service'
import type { ArkTSExtraLanguageServiceImpl } from '../language-service-impl'
import type { OpenHarmonyModule, OpenHarmonyProjectDetector, ResourceMediaFile } from '../project'
import { typeAssert } from '@arkts/shared'
import { CompletionItemKind, DiagnosticSeverity, MarkupKind, Position, Range } from '@volar/language-server'
import { URI } from 'vscode-uri'
import { ElementJsonFile, ResourceFolder } from '../project'
import { ContextUtil } from '../utils/context-util'

export function createModuleJson5Service(service: ArkTSExtraLanguageService, detector: OpenHarmonyProjectDetector): LanguageServicePlugin {
  typeAssert<ArkTSExtraLanguageServiceImpl>(service)
  const ets = service.getETS()

  return {
    name: 'arkts-module.json5',
    capabilities: {
      definitionProvider: true,
      diagnosticProvider: {
        interFileDependencies: true,
        workspaceDiagnostics: true,
      },
      hoverProvider: true,
      completionProvider: {
        triggerCharacters: ['"', '\'', '`', ':', '$'],
        resolveProvider: false,
      },
    },
    create(context) {
      const contextUtil = new ContextUtil(context)
      const resourceUtil = contextUtil.getResourceUtil(detector, ets)

      async function searchResource(document: TextDocument, position: Position): Promise<[OpenHarmonyModule.GroupByResourceReference[], ModuleJson5ResourceReference] | [[], null]> {
        const moduleJson5SourceFile = await getModuleJson5SourceFile(document)
        if (!moduleJson5SourceFile)
          return [[], null]
        const moduleJson5ResourceReferences = service.getModuleJson5ResourceReferences(moduleJson5SourceFile, document)
        const matchedModuleJson5ResourceReference = moduleJson5ResourceReferences.find(reference => reference.start.line === position.line && reference.start.character <= position.character && reference.end.character >= position.character)
        if (!matchedModuleJson5ResourceReference)
          return [[], null]
        const resources = await detector.searchResource(`app.${matchedModuleJson5ResourceReference.kind}.${matchedModuleJson5ResourceReference.name}`, ets, detector.getForce())
        return [resources, matchedModuleJson5ResourceReference]
      }

      async function provideImplementation(document: TextDocument, position: Position): Promise<LocationLink[] | null> {
        const [resources, matchedModuleJson5ResourceReference] = await searchResource(document, position)
        if (!matchedModuleJson5ResourceReference)
          return resources

        const locationLinks: LocationLink[] = []

        for (const resource of resources) {
          if (ElementJsonFile.isNameRangeReference(resource)) {
            for (const nameRange of resource.references) {
              locationLinks.push({
                targetUri: nameRange.getElementJsonFile().getUri().toString(),
                targetRange: Range.create(
                  nameRange.getStart(),
                  nameRange.getEnd(),
                ),
                targetSelectionRange: Range.create(
                  nameRange.getStart(),
                  nameRange.getEnd(),
                ),
                originSelectionRange: Range.create(
                  matchedModuleJson5ResourceReference.start,
                  matchedModuleJson5ResourceReference.end,
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
              targetUri: resource.getUri().toString(),
              targetRange,
              targetSelectionRange: targetRange,
              originSelectionRange: Range.create(
                matchedModuleJson5ResourceReference.start,
                matchedModuleJson5ResourceReference.end,
              ),
            })
          }
        }

        return locationLinks
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

      return {
        async provideDefinition(document, position) {
          return provideImplementation(document, position)
        },

        async provideImplementation(document, position) {
          return provideImplementation(document, position)
        },

        async provideHover(document, position): Promise<Hover | null> {
          const [resources, matchedModuleJson5ResourceReference] = await searchResource(document, position)
          if (!matchedModuleJson5ResourceReference || resources.length === 0)
            return null

          const filteredResources: ResourceMediaFile[] = []

          for (const resource of resources) {
            if (resource.kind === ResourceFolder.ResourceKind.Element)
              continue
            const isImage = await resource.isImage()
            if (isImage)
              filteredResources.push(resource)
          }

          return {
            contents: {
              kind: MarkupKind.Markdown,
              value: filteredResources
                .map(resource => `![](${resource.getUri().toString()})`)
                .join('\n'),
            },
          }
        },

        async provideDiagnostics(document) {
          if (document.languageId !== 'json' && document.languageId !== 'jsonc')
            return null
          const moduleJson5SourceFile = await getModuleJson5SourceFile(document)
          if (!moduleJson5SourceFile)
            return null
          const references = await resourceUtil.getResourceReference(document)
          const diagnostics: Diagnostic[] = []
          moduleJson5SourceFile.forEachChild(function visitor(node) {
            node.forEachChild(visitor)
            if (!ets.isStringLiteral(node))
              return
            const text = node.getText(moduleJson5SourceFile).replace(/^['"]|['"]$/g, '')
            if (!text.includes(':') || !text.startsWith('$'))
              return

            const [kindWithDollar, name] = text.split(':')
            const kind = kindWithDollar.replace(/^\$/, '')
            if (!ElementJsonFile.ElementKind.is(kind) && kind !== 'media' && kind !== 'profile') {
              diagnostics.push({
                range: Range.create(
                  document.positionAt(node.getStart(moduleJson5SourceFile)),
                  document.positionAt(node.getEnd()),
                ),
                message: `Invalid resource kind: ${kind}`,
                severity: DiagnosticSeverity.Error,
                source: 'arkts-module.json5',
                code: 'ARKTS_MODULE_JSON5_INVALID_RESOURCE_KIND',
              })
            }
            const matchedReference = references.find(reference =>
              ElementJsonFile.isNameRangeReference(reference)
                ? reference.getName() === name
                : reference.getFileNameWithoutExtension() === name,
            )
            if (!matchedReference) {
              diagnostics.push({
                range: Range.create(
                  document.positionAt(node.getStart(moduleJson5SourceFile)),
                  document.positionAt(node.getEnd()),
                ),
                message: `Resource ${name} not found.`,
                severity: DiagnosticSeverity.Error,
                source: 'arkts-module.json5',
                code: 'ARKTS_MODULE_JSON5_RESOURCE_NOT_FOUND',
              })
            }
          })

          return diagnostics
        },

        async provideCompletionItems(document: TextDocument, position: Position): Promise<CompletionList | null> {
          if (document.languageId !== 'json' && document.languageId !== 'jsonc')
            return null

          const moduleJson5SourceFile = await getModuleJson5SourceFile(document)
          if (!moduleJson5SourceFile)
            return null
          const references = await resourceUtil.getResourceReference(document)
          const matchedNode = service.getCurrentPositionNode(moduleJson5SourceFile, document, position, ets.isStringLiteral)
          if (!matchedNode)
            return null
          const matchedNodeText = matchedNode.getText(moduleJson5SourceFile).replace(/^['"]|['"]$/g, '')

          if (!matchedNodeText.includes(':') && matchedNodeText.startsWith('$')) {
            const completionItems: CompletionItem[] = []

            for (const reference of references) {
              if (ElementJsonFile.isNameRangeReference(reference)) {
                for (const nameRange of reference.references) {
                  completionItems.push({
                    label: `${nameRange.kind}:${nameRange.getText()}`,
                    kind: CompletionItemKind.Reference,
                  })
                }
              }
              else {
                completionItems.push({
                  label: `${reference.kind}:${reference.getFileNameWithoutExtension()}`,
                  kind: CompletionItemKind.File,
                })
              }
            }

            return {
              isIncomplete: true,
              items: completionItems.filter((reference, index, self) => self.findIndex(r => r.label === reference.label) === index),
            }
          }

          if (matchedNodeText.includes(':') && matchedNodeText.startsWith('$')) {
            const matchedKind = matchedNodeText.split(':')[0].trim().replace(/^\$/, '')
            return {
              isIncomplete: true,
              items: references
                .filter(reference => (
                  ElementJsonFile.isNameRangeReference(reference)
                    ? reference.references.some(reference => reference.kind === matchedKind)
                    : reference.kind === matchedKind
                ))
                .map((reference): CompletionItem => {
                  if (ElementJsonFile.isNameRangeReference(reference)) {
                    return {
                      kind: CompletionItemKind.Reference,
                      label: reference.getName(),
                    }
                  }
                  else {
                    return {
                      kind: CompletionItemKind.File,
                      label: reference.getFileNameWithoutExtension(),
                    }
                  }
                }),
            }
          }

          return null
        },
      }
    },
  }
}
