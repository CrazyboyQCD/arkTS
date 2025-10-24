import type { LanguageServerConfigurator } from '@arkts/shared'
import type { LanguageServicePlugin } from '@volar/language-server'
import type { ProjectDetectorManager } from '../interfaces/project-detector-manager'
import { createArkTSResource } from './arkts-resource'

export async function createArkTServices(projectDetectorManager: ProjectDetectorManager, ets: typeof import('ohos-typescript'), config: LanguageServerConfigurator): Promise<LanguageServicePlugin[]> {
  return [
    await createArkTSResource(projectDetectorManager, ets, config),
  ]
}
