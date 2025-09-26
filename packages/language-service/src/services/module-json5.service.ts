import type { CompletionList, LanguageServicePlugin, LocationLink } from '@volar/language-server'
import type { Position } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { ArkTSExtraLanguageService } from '../language-service'
import type { ArkTSExtraLanguageServiceImpl } from '../language-service-impl'
import type { OpenHarmonyProjectDetector } from '../project'
import path from 'node:path'
import { typeAssert } from '@arkts/shared'
import { CompletionItemKind, MarkupKind, Range } from '@volar/language-server'
import { URI } from 'vscode-uri'
import { ContextUtil } from '../utils/context-util'

export function createModuleJson5Service(service: ArkTSExtraLanguageService, detector: OpenHarmonyProjectDetector): LanguageServicePlugin {
  typeAssert<ArkTSExtraLanguageServiceImpl>(service)
  const ets = service.getETS()

  return {
    name: 'arkts-module.json5',
    capabilities: {
      definitionProvider: true,
      completionProvider: {
        triggerCharacters: ['.', '"', '\'', '`', ':'],
        resolveProvider: false,
      },
    },
    create(context) {
      const contextUtil = new ContextUtil(context)
      const resourceUtil = contextUtil.getResourceUtil(detector, ets)

      async function provideImplementation(document: TextDocument, position: Position): Promise<LocationLink[] | null> {
        if (document.languageId !== 'json' && document.languageId !== 'jsonc')
          return null
        const moduleJson5SourceFile = await getModuleJson5SourceFile(document)
        if (!moduleJson5SourceFile)
          return null

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

        async provideCompletionItems(document: TextDocument, position: Position, context): Promise<CompletionList | null> {
          if (document.languageId !== 'json' && document.languageId !== 'jsonc')
            return null

          if (context.triggerCharacter !== ':')
            return null
          const moduleJson5SourceFile = await getModuleJson5SourceFile(document)
          if (!moduleJson5SourceFile)
            return null
          const references = await resourceUtil.getResourceReference(document)
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
        },
      }
    },
  }
}
