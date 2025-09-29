import type { WorkspaceLevelBuildProfile } from '@arkts/types'
import type { DeepPartial } from 'packages/language-service/src/types/util'
import type { URI } from 'vscode-uri'
import type { FileSystemAdapter } from '../../interfaces/file-system/file-system-adapter'
import type { WorkspaceBuildProfileFile } from '../../interfaces/file/workspace-build-profile'
import type { TextDocumentUpdater } from '../../interfaces/project-detector'
import type { Workspace } from '../../interfaces/workspace'
import type { ProjectDetectorImpl } from '../project-detector'
import { Utils } from 'vscode-uri'
import { JsonLikeFileImpl } from './json-like-file'

export class WorkspaceBuildProfileFileImpl extends JsonLikeFileImpl<DeepPartial<WorkspaceLevelBuildProfile>> implements WorkspaceBuildProfileFile {
  constructor(
    private readonly workspace: Workspace,
    private readonly uri: URI,
  ) {
    super()
  }

  async setup(): Promise<void> {
    const projectDetector = this.workspace.getProjectDetector() as ProjectDetectorImpl
    const buildProfileInfo = await projectDetector.readBuildProfileInfo()
    const cacheStorage = this.getCacheStorage<WorkspaceBuildProfileFileImpl>()
    const foundProfileInfo = buildProfileInfo.find(info => info.buildProfilePath && info.buildProfilePath.toString() === this.uri.toString())
    if (!foundProfileInfo) return
    const workspaceBuildProfile = foundProfileInfo.parsedBuildProfileContent as DeepPartial<WorkspaceLevelBuildProfile>
    cacheStorage.set('safeParse', workspaceBuildProfile)
    cacheStorage.set('readToString', foundProfileInfo.buildProfileContent)
  }

  getUri(): URI {
    return this.uri
  }

  getFileSystem(): Promise<FileSystemAdapter> {
    return this.workspace.getFileSystem()
  }

  getTextDocumentUpdater(): TextDocumentUpdater {
    return this.workspace.getTextDocumentUpdater()
  }

  getWorkspace(): Workspace {
    return this.workspace
  }

  async getModulePaths(force: boolean = false): Promise<URI[]> {
    return super.computedAsync('getModulePaths', async () => {
      const parsedBuildProfile = await this.safeParse()
      const modulePaths: URI[] = []

      for (const module of parsedBuildProfile.modules ?? []) {
        if (!module?.srcPath) continue
        modulePaths.push(Utils.resolvePath(this.getWorkspace().getUri(), module.srcPath))
      }

      return modulePaths
    }, force)
  }

  safeParse(force: boolean = false): Promise<DeepPartial<WorkspaceLevelBuildProfile>> {
    return super.safeParse(force) as Promise<DeepPartial<WorkspaceLevelBuildProfile>>
  }
}
