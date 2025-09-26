import type { LanguageServicePlugin, LocationLink } from '@volar/language-server'
import type { ArkTSExtraLanguageService } from '../language-service'
import type { ArkTSExtraLanguageServiceImpl } from '../language-service-impl'
import type { OpenHarmonyProjectDetector } from '../project'
import { typeAssert } from '@arkts/shared'
import { Range } from '@volar/language-server'
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

          const resourceReference = resourceReferences.find(reference => reference.name === matchedNameRange?.text)?.references ?? []
          const locationLinks: LocationLink[] = []

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
        },
      }
    },
  }
}
