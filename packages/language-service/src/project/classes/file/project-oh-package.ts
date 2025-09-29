import type { ProjectLevelOhPackageJson5 } from '@arkts/types'
import type { DeepPartial } from 'packages/language-service/src/types/util'
import type { URI } from 'vscode-uri'
import type { FileSystemAdapter } from '../../interfaces/file-system/file-system-adapter'
import type { ProjectOhPackageFile } from '../../interfaces/file/project-oh-package'
import type { Module } from '../../interfaces/module'
import type { TextDocumentUpdater } from '../../interfaces/project-detector'
import { JsonLikeFileImpl } from './json-like-file'

export class ProjectOhPackageFileImpl extends JsonLikeFileImpl<DeepPartial<ProjectLevelOhPackageJson5>> implements ProjectOhPackageFile {
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
}
