import type { LanguageServicePlugin } from '@volar/language-server'
import type { Diagnostic, LocationLink, Position } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import type { ArkTSExtraLanguageService } from '../language-service'
import type { ArkTSExtraLanguageServiceImpl } from '../language-service-impl'
import type { OpenHarmonyProjectDetector } from '../project'
import type { ElementJsonFile } from '../project/project'
import { typeAssert } from '@arkts/shared'
import { DiagnosticSeverity, Range } from 'vscode-languageserver-protocol'
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
        const resourceFolder = await project.readResourceFolder(detector.getForce())
        if (!resourceFolder)
          return []
        const references = await Promise.all(
          resourceFolder
            .filter(folder => folder.isElementFolder())
            .map(folder => folder.getElementNameRangeReference(ets, detector.getForce())),
        )
          .then(references => references.flat())
          .then(
            references => references.reduce<ElementJsonFile.NameRangeReference[]>((acc, reference) => {
              const foundIndex = acc.findIndex(item => item.name === reference.name)
              if (foundIndex === -1)
                acc.push(reference)
              return acc
            }, []),
          )
        detector.setForce(false)
        return references
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

        async provideDefinition(document, position): Promise<LocationLink[]> {
          if (document.languageId === 'json') {
            const jsonSourceFile = contextUtil.decodeSourceFile<import('ohos-typescript').JsonSourceFile>(document)
            if (!jsonSourceFile)
              return []
            const locationLinks: LocationLink[] = []
            const matchedNameRange = await getResourceElementName(document, position)
            if (!matchedNameRange)
              return []
            const resourceReferences = await getResourceReference(document)
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
