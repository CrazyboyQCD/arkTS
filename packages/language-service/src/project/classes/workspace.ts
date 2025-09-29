import type { URI } from 'vscode-uri'
import type { FileSystemAdapter } from '../interfaces/file-system/file-system-adapter'
import type { WorkspaceBuildProfileFile } from '../interfaces/file/workspace-build-profile'
import type { WorkspaceOhPackageFile } from '../interfaces/file/workspace-oh-package'
import type { Module } from '../interfaces/module'
import type { TextDocumentUpdater } from '../interfaces/project-detector'
import type { Workspace } from '../interfaces/workspace'
import type { ProjectDetectorImpl } from './project-detector'
import { WorkspaceLevelBuildProfile } from '@arkts/types'
import { Utils } from 'vscode-uri'
import { DirectoryImpl } from './common/directory'
import { WorkspaceBuildProfileFileImpl } from './file/workspace-build-profile'
import { WorkspaceOhPackageFileImpl } from './file/workspace-oh-package'
import { ModuleImpl } from './module'

export class WorkspaceImpl extends DirectoryImpl implements Workspace {
  constructor(
    private readonly projectDetector: ProjectDetectorImpl,
    private readonly uri: URI,

  ) { super() }

  getProjectDetector(): ProjectDetectorImpl {
    return this.projectDetector
  }

  getUri(): URI {
    return this.uri
  }

  getFileSystem(): Promise<FileSystemAdapter> {
    return this.projectDetector.getFileSystem()
  }

  getTextDocumentUpdater(): TextDocumentUpdater {
    return this.projectDetector.getTextDocumentUpdater()
  }

  getWorkspaceBuildProfile(force: boolean = false): Promise<WorkspaceBuildProfileFile> {
    return super.computedAsync('getWorkspaceBuildProfile', async () => {
      return new WorkspaceBuildProfileFileImpl(this, Utils.joinPath(this.getUri(), 'build-profile.json5'))
    }, force)
  }

  getWorkspaceOhPackage(force: boolean = false): Promise<WorkspaceOhPackageFile> {
    return super.computedAsync('getWorkspaceOhPackage', async () => {
      const workspaceOhPackageFile = new WorkspaceOhPackageFileImpl(this, Utils.joinPath(this.getUri(), 'oh-package.json5'))
      await workspaceOhPackageFile.setup()
      return workspaceOhPackageFile
    }, force)
  }

  async findModules(force: boolean = false): Promise<Module[]> {
    return super.computedAsync('findModules', async () => {
      const modules: Module[] = []
      const projectDetector = this.getProjectDetector()
      const ohPackageWithBuildProfile = await projectDetector.readBuildProfileInfo(force) ?? []
      const workspaceBuildProfile = await this.getWorkspaceBuildProfile(force)
      const modulePaths = await workspaceBuildProfile.getModulePaths(force)

      for (const { parsedBuildProfileContent, projectPath } of ohPackageWithBuildProfile) {
        // If the build-profile.json5 is a workspace level build-profile.json5, skip
        if (WorkspaceLevelBuildProfile.is(parsedBuildProfileContent)) continue
        // If the build-profile.json5 is not in the workspace, skip
        if (!modulePaths.find(modulePath => modulePath.toString() === projectPath.toString())) continue
        modules.push(new ModuleImpl(this, projectPath))
      }

      return modules
    }, force)
  }
}
