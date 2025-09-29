import type { FileSystemAdapter } from '../interfaces/file-system/file-system-adapter'
import type { ProjectDetector, TextDocumentUpdater } from '../interfaces/project-detector'
import type { Workspace } from '../interfaces/workspace'
import { WorkspaceLevelBuildProfile } from '@arkts/types'
import { URI, Utils } from 'vscode-uri'
import { TextDocumentUpdaterImpl } from './common/textdocument-updater'
import { WorkspaceModuleContext } from './common/workspace-project-context'
import { createNodeFileSystem } from './node-file-system'
import { WorkspaceImpl } from './workspace'

export class ProjectDetectorImpl extends WorkspaceModuleContext implements ProjectDetector {
  constructor(
    private readonly workspaceFolder: string,
    private readonly fileSystem?: FileSystemAdapter,
  ) { super() }

  getTextDocumentUpdater(): TextDocumentUpdater {
    return super.computedSync('getTextDocumentUpdater', () => {
      return new TextDocumentUpdaterImpl()
    })
  }

  getWorkspaceFolder(): URI {
    return URI.file(this.workspaceFolder)
  }

  isWorkspaceFolderExist(force: boolean = false): Promise<boolean> {
    return super.computedAsync('isWorkspaceFolderExist', async () => {
      const fileSystem = await this.getFileSystem()
      return await fileSystem.exists(this.getWorkspaceFolder()) && (await fileSystem.stat(this.getWorkspaceFolder())).isDirectory()
    }, force)
  }

  findWorkspaces(force: boolean = false): Promise<Workspace[]> {
    return super.computedAsync('findWorkspaces', async () => {
      if (!await this.isWorkspaceFolderExist(force)) return []
      const workspaces: Workspace[] = []
      const ohPackageJson5Files = await this.readBuildProfileInfo(force)

      for (const { parsedBuildProfileContent, buildProfilePath } of ohPackageJson5Files) {
        try {
          const workspaceUri = Utils.dirname(buildProfilePath)
          // check is valid workspace level build-profile.json5
          if (!WorkspaceLevelBuildProfile.is(parsedBuildProfileContent)) continue
          workspaces.push(new WorkspaceImpl(this, workspaceUri))
        }
        catch {}
      }

      return workspaces
    }, force)
  }

  async getFileSystem(): Promise<FileSystemAdapter> {
    return super.computedAsync('getFileSystem', async () => {
      return this.fileSystem ?? await createNodeFileSystem()
    })
  }
}
