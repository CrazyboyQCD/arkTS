import type { URI } from 'vscode-uri'
import type { Element } from '../../interfaces/directory/element'
import type { ResourceGroup } from '../../interfaces/directory/resource-group'
import type { FileSystemAdapter } from '../../interfaces/file-system/file-system-adapter'
import type { ElementJsonFile } from '../../interfaces/file/element-json'
import type { TextDocumentUpdater } from '../../interfaces/project-detector'
import { Utils } from 'vscode-uri'
import { DirectoryImpl } from '../common/directory'
import { ElementJsonFileImpl } from '../file/element-json'

export class ElementImpl extends DirectoryImpl implements Element {
  constructor(private readonly resourceGroup: ResourceGroup) {
    super()
  }

  getUri(): URI {
    return super.computedSync('getUri', () => Utils.joinPath(this.resourceGroup.getUri(), 'element'))
  }

  getFileSystem(): Promise<FileSystemAdapter> {
    return this.resourceGroup.getFileSystem()
  }

  getTextDocumentUpdater(): TextDocumentUpdater {
    return this.resourceGroup.getTextDocumentUpdater()
  }

  getResourceGroup(): ResourceGroup {
    return this.resourceGroup
  }

  getElementJsonFiles(force?: boolean): Promise<ElementJsonFile[]> {
    return super.computedAsync('getElementJsonFiles', async () => {
      const children = await super.listDirectory(force)
      const elementJsonFiles: ElementJsonFile[] = []
      for (const child of children) {
        elementJsonFiles.push(new ElementJsonFileImpl(this, Utils.joinPath(this.getUri(), child)))
      }
      return elementJsonFiles
    }, force)
  }
}
