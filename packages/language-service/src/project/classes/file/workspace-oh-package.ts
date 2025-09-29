import type { WorkspaceLevelOhPackage5 } from '@arkts/types'
import type { DeepPartial } from 'packages/language-service/src/types/util'
import type { URI } from 'vscode-uri'
import type { FileSystemAdapter } from '../../interfaces/file-system/file-system-adapter'
import type { WorkspaceOhPackageFile } from '../../interfaces/file/workspace-oh-package'
import type { TextDocumentUpdater } from '../../interfaces/project-detector'
import type { Workspace } from '../../interfaces/workspace'
import type { ProjectDetectorImpl } from '../project-detector'
import { JsonLikeFileImpl } from './json-like-file'

export class WorkspaceOhPackageFileImpl extends JsonLikeFileImpl<DeepPartial<WorkspaceLevelOhPackage5>> implements WorkspaceOhPackageFile {
  constructor(
    private readonly workspace: Workspace,
    private readonly uri: URI,
  ) {
    super()
  }

  async setup(): Promise<void> {
    const projectDetector = this.workspace.getProjectDetector() as ProjectDetectorImpl
    const buildProfileInfo = await projectDetector.readBuildProfileInfo()
    const cacheStorage = this.getCacheStorage<WorkspaceOhPackageFileImpl>()
    const foundProfileInfo = buildProfileInfo.find(info => info.ohPackagePath && info.ohPackagePath.toString() === this.uri.toString())
    if (!foundProfileInfo) return
    if (!foundProfileInfo.parsedOhPackageContent || !foundProfileInfo.ohPackageContent) return
    cacheStorage.set('safeParse', foundProfileInfo.parsedOhPackageContent)
    cacheStorage.set('readToString', foundProfileInfo.ohPackageContent)
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

  safeParse(force: boolean = false): Promise<DeepPartial<WorkspaceLevelOhPackage5>> {
    return super.safeParse(force) as Promise<DeepPartial<WorkspaceLevelOhPackage5>>
  }
}
