import type { URI } from 'vscode-uri'
import type { FileSystemAdapter } from '../interfaces/file-system/file-system-adapter'
import type { ModuleJsonFile } from '../interfaces/file/module-json'
import type { Module } from '../interfaces/module'
import type { Product } from '../interfaces/product'
import type { TextDocumentUpdater } from '../interfaces/project-detector'
import type { Resource } from '../interfaces/resource'
import { Utils } from 'vscode-uri'
import { DirectoryImpl } from './common/directory'
import { ModuleJsonFileImpl } from './file/module-json'
import { ResourceImpl } from './resource'

export class ProductImpl extends DirectoryImpl implements Product {
  constructor(
    private readonly module: Module,
    private readonly uri: URI,
  ) {
    super()
  }

  getUri(): URI {
    return this.uri
  }

  getFileSystem(): Promise<FileSystemAdapter> {
    return this.module.getFileSystem()
  }

  getTextDocumentUpdater(): TextDocumentUpdater {
    return this.module.getTextDocumentUpdater()
  }

  getModule(): Module {
    return this.module
  }

  getModuleJson(): Promise<ModuleJsonFile> {
    return super.computedAsync('getModuleJson', async () => {
      return new ModuleJsonFileImpl(this, Utils.joinPath(this.getUri(), 'module.json5'))
    })
  }

  getResources(): Promise<Resource[]> {
    return super.computedAsync('getResources', async () => {
      const resources: Resource[] = []
      const moduleBuildProfile = await this.getModule().getProjectBuildProfile()
      const targetNames = await moduleBuildProfile.getTargetNames()

      for (const targetName of targetNames) {
        const resourceDirectories = await moduleBuildProfile.getResourceDirectoriesByTargetName(targetName)
        if (!resourceDirectories) continue

        for (const resourceDirectory of resourceDirectories) {
          if (resources.find(resource => resource.getUri().toString() === resourceDirectory.toString())) continue
          resources.push(new ResourceImpl(this, resourceDirectory))
        }
      }

      return resources
    })
  }
}
