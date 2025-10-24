import type { DisposableSignal, ResourceDirectory as RustResourceDirectory } from '@arkts/project-detector'
import type { Disposable } from 'vscode'
import type { Resource } from './resource'
import { ElementDirectory as RustElementDirectory } from '@arkts/project-detector'
import { UriUtil } from '../utils/uri-util'
import { ElementDirectory } from './element-directory'

export interface ResourceDirectory extends Disposable {
  getResource(): Resource
  getUnderlyingResourceDirectory(): RustResourceDirectory
  getElementDirectory(): ElementDirectory | null
}

export namespace ResourceDirectory {
  class ResourceDirectoryImpl implements ResourceDirectory {
    private readonly elementDirectorySignal: DisposableSignal<RustElementDirectory | null>
    constructor(
      private readonly resource: Resource,
      private readonly rustResourceDirectory: RustResourceDirectory,
    ) {
      this.elementDirectorySignal = RustElementDirectory.from(this.rustResourceDirectory)
    }

    getResource(): Resource {
      return this.resource
    }

    getUnderlyingResourceDirectory(): RustResourceDirectory {
      return this.rustResourceDirectory
    }

    getElementDirectory(): ElementDirectory | null {
      return ElementDirectory.create(this, this.elementDirectorySignal())
    }

    findByUri(uri: string): ElementDirectory | undefined {
      const elementDirectory = this.getElementDirectory()
      if (!elementDirectory) return undefined
      return UriUtil.isContains(uri, elementDirectory.getUnderlyingElementDirectory().getUri())
        ? elementDirectory.findByUri(uri) ? elementDirectory : undefined
        : undefined
    }

    dispose(): void {
      this.elementDirectorySignal.dispose()
    }
  }

  export function create(resource: Resource, rustResourceDirectory: RustResourceDirectory): ResourceDirectory {
    return new ResourceDirectoryImpl(resource, rustResourceDirectory)
  }
}
