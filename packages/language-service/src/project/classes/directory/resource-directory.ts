import type { URI } from 'vscode-uri'
import type { ResourceDirectory } from '../../interfaces/directory/resource-directory'
import type { FileSystemAdapter } from '../../interfaces/file-system/file-system-adapter'
import type { TextDocumentUpdater } from '../../interfaces/project-detector'
import type { Resource } from '../../interfaces/resource'
import { DirectoryImpl } from '../common/directory'

export abstract class ResourceDirectoryImpl extends DirectoryImpl implements ResourceDirectory {
  constructor(
    private readonly resource: Resource,
    private readonly uri: URI,
  ) {
    super()
  }

  abstract readonly resourceDirectoryKind: ResourceDirectory.Kind

  getUri(): URI {
    return this.uri
  }

  getFileSystem(): Promise<FileSystemAdapter> {
    return this.resource.getFileSystem()
  }

  getTextDocumentUpdater(): TextDocumentUpdater {
    return this.resource.getTextDocumentUpdater()
  }

  getResource(): Resource {
    return this.resource
  }
}
