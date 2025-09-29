import type { ModuleJson5 } from '@arkts/types'
import type { URI } from 'vscode-uri'
import type { FileSystemAdapter } from '../../interfaces/file-system/file-system-adapter'
import type { ModuleJsonFile } from '../../interfaces/file/module-json'
import type { Product } from '../../interfaces/product'
import type { TextDocumentUpdater } from '../../interfaces/project-detector'
import { JsonLikeFileImpl } from './json-like-file'

export class ModuleJsonFileImpl extends JsonLikeFileImpl<ModuleJson5> implements ModuleJsonFile {
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
}
