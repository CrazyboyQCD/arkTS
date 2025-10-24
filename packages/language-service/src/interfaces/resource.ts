import type { DisposableSignal, Resource as RustResource } from '@arkts/project-detector'
import type { Disposable } from 'vscode'
import type { Product } from './product'
import { ResourceDirectory as RustResourceDirectory } from '@arkts/project-detector'
import { UriUtil } from '../utils/uri-util'
import { ResourceDirectory } from './resource-directory'

export interface Resource extends Disposable {
  getProduct(): Product
  getUnderlyingResource(): RustResource
  findAll(): ResourceDirectory[]
  findByUri(uri: string): ResourceDirectory | undefined
}

export namespace Resource {
  class ResourceImpl implements Resource {
    private readonly findAllSignal: DisposableSignal<RustResourceDirectory[]>
    constructor(
      private readonly product: Product,
      private readonly rustResource: RustResource,
    ) {
      this.findAllSignal = RustResourceDirectory.findAll(this.rustResource)
    }

    getProduct(): Product {
      return this.product
    }

    findAll(): ResourceDirectory[] {
      return this.findAllSignal().map(resourceDirectory => ResourceDirectory.create(this, resourceDirectory))
    }

    findByUri(uri: string): ResourceDirectory | undefined {
      return this.findAll().find(resourceDirectory => UriUtil.isContains(uri, resourceDirectory.getUnderlyingResourceDirectory().getUri()))
    }

    getUnderlyingResource(): RustResource {
      return this.rustResource
    }

    dispose(): void {
      this.findAllSignal.dispose()
    }
  }

  export function create(product: Product, rustResource: RustResource): Resource {
    return new ResourceImpl(product, rustResource)
  }
}
