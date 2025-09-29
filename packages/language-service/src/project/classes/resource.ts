import type { URI } from 'vscode-uri'
import type { FileSystemAdapter } from '../interfaces/file-system/file-system-adapter'
import type { Product } from '../interfaces/product'
import type { TextDocumentUpdater } from '../interfaces/project-detector'
import type { Resource } from '../interfaces/resource'
import { Utils } from 'vscode-uri'
import { DirectoryImpl } from './common/directory'
import { RawFileImpl } from './directory/rawfile'
import { ResFileImpl } from './directory/resfile'
import { ResourceGroupImpl } from './directory/resource-group'

export class ResourceImpl extends DirectoryImpl implements Resource {
  constructor(
    private readonly product: Product,
    private readonly uri: URI,
  ) {
    super()
  }

  getUri(): URI {
    return this.uri
  }

  getFileSystem(): Promise<FileSystemAdapter> {
    return this.product.getFileSystem()
  }

  getTextDocumentUpdater(): TextDocumentUpdater {
    return this.product.getTextDocumentUpdater()
  }

  getProduct(): Product {
    return this.product
  }

  async getResourceDirectories(force?: boolean): Promise<Resource.ResourceDirectory[]> {
    return super.computedAsync('getResourceDirectories', async () => {
      const children = await super.listDirectory(force)
      const resourceDirectories: Resource.ResourceDirectory[] = []

      for (const childDirectoryName of children) {
        switch (childDirectoryName) {
          case 'rawfile':
            resourceDirectories.push(new RawFileImpl(this, Utils.joinPath(this.getUri(), childDirectoryName)))
            break
          case 'resfile':
            resourceDirectories.push(new ResFileImpl(this, Utils.joinPath(this.getUri(), childDirectoryName)))
            break
          default:
            resourceDirectories.push(new ResourceGroupImpl(this, Utils.joinPath(this.getUri(), childDirectoryName)))
            break
        }
      }

      return resourceDirectories
    }, force)
  }
}
