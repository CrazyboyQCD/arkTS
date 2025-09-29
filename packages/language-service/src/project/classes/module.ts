import type { FileSystemAdapter } from '../interfaces/file-system/file-system-adapter'
import type { ProjectBuildProfileFile } from '../interfaces/file/project-build-profile'
import type { ProjectOhPackageFile } from '../interfaces/file/project-oh-package'
import type { Module } from '../interfaces/module'
import type { Product } from '../interfaces/product'
import type { TextDocumentUpdater } from '../interfaces/project-detector'
import type { Workspace } from '../interfaces/workspace'
import { URI, Utils } from 'vscode-uri'
import { DirectoryImpl } from './common/directory'
import { ProjectBuildProfileFileImpl } from './file/project-build-profile'
import { ProjectOhPackageFileImpl } from './file/project-oh-package'
import { ProductImpl } from './product'

export class ModuleImpl extends DirectoryImpl implements Module {
  constructor(
    private readonly workspace: Workspace,
    private readonly uri: URI,
  ) {
    super()
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

  getProjectBuildProfile(): Promise<ProjectBuildProfileFile> {
    return super.computedAsync('getProjectBuildProfile', async () => {
      return new ProjectBuildProfileFileImpl(this, Utils.joinPath(this.getUri(), 'build-profile.json5'))
    })
  }

  getProjectOhPackage(): Promise<ProjectOhPackageFile> {
    return super.computedAsync('getProjectOhPackage', async () => {
      return new ProjectOhPackageFileImpl(this, Utils.joinPath(this.getUri(), 'oh-package.json5'))
    })
  }

  async findProducts(force: boolean = false): Promise<Product[]> {
    return super.computedAsync('findProducts', async () => {
      const modules: Product[] = []
      const fileSystem = await this.getFileSystem()
      const buildProfile = await this.getProjectBuildProfile()
      const targetNames = await buildProfile.getTargetNames(force)

      const globPattern = Utils.joinPath(this.getUri(), '**', 'module.json5')
      const moduleJson5Paths = await fileSystem.glob(globPattern.fsPath, {
        absolute: true,
        onlyFiles: true,
        onlyDirectories: false,
        ignore: [
          '**/node_modules/**',
          '**/oh_modules/**',
          '**/.git/**',
          '**/.vscode/**',
          '**/.idea/**',
          '**/.svn/**',
        ],
      })

      for (const moduleJson5Path of moduleJson5Paths) {
        const moduleJson5Uri = URI.file(moduleJson5Path)

        try {
          if (moduleJson5Uri.fsPath.includes('main') && targetNames.includes('default')) modules.push(new ProductImpl(this, Utils.dirname(moduleJson5Uri)))
          if (!targetNames.find(targetName => moduleJson5Uri.fsPath.includes(targetName))) continue
          modules.push(new ProductImpl(this, Utils.dirname(moduleJson5Uri)))
        }
        catch {}
      }

      return modules
    }, force)
  }
}
