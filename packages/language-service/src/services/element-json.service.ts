import type { LanguageServicePlugin, LocationLink } from '@volar/language-server'
import type { ArkTSExtraLanguageService } from '../language-service'
import type { ArkTSExtraLanguageServiceImpl } from '../language-service-impl'
import type { OpenHarmonyProjectDetector } from '../project'
import { typeAssert } from '@arkts/shared'
import { Range } from '@volar/language-server'
import { ElementJsonFile } from '../project'
import { ContextUtil } from '../utils/context-util'

export function createETSElementJsonService(service: ArkTSExtraLanguageService, detector: OpenHarmonyProjectDetector): LanguageServicePlugin {
  typeAssert<ArkTSExtraLanguageServiceImpl>(service)
  const ets = service.getETS()

  return {
    name: 'arkts-element-json',
    capabilities: {
      definitionProvider: true,
    },
    create(context) {
      const contextUtil = new ContextUtil(context)
      const resourceUtil = contextUtil.getResourceUtil(detector, ets)

      return {
        async provideDefinition(document, position) {
          if (document.languageId !== 'json' && document.languageId !== 'jsonc')
            return null
          const resourceReferences = await resourceUtil.getResourceReference(document)
          const matchedNameRange = await resourceUtil.getResourceElementName(document, position)
          if (!matchedNameRange)
            return []

          const matchedElementReference = resourceReferences.find(reference => ElementJsonFile.isNameRangeReference(reference) && reference.getName() === matchedNameRange?.getText()) as ElementJsonFile.NameRangeReference | undefined
          if (!matchedElementReference)
            return []
          const locationLinks: LocationLink[] = []

          for (const reference of matchedElementReference.references) {
            const elementJsonFile = reference.getElementJsonFile()
            locationLinks.push({
              targetUri: elementJsonFile.getUri().toString(),
              targetRange: Range.create(
                reference.getStart(),
                reference.getEnd(),
              ),
              targetSelectionRange: Range.create(
                reference.getStart(),
                reference.getEnd(),
              ),
              originSelectionRange: Range.create(
                matchedNameRange.getStart(),
                matchedNameRange.getEnd(),
              ),
            })
          }

          return locationLinks
        },
      }
    },
  }
}
