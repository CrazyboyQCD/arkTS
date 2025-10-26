import type { ElementJsonFileReference as RustElementJsonFileReference, Uri } from '@arkts/project-detector'
import type { ElementJsonFile } from './element-json-file'
import type { ResourceReference } from './reference'

export interface ElementJsonFileReference extends ResourceReference {
  getElementJsonFile(): ElementJsonFile
  getUnderlyingElementJsonFileReference(): RustElementJsonFileReference
  toEtsFormat(): `app.${string}.${string}`
  toJsonFormat(): `$${string}:${string}`
}

export namespace ElementJsonFileReference {
  class ElementJsonFileReferenceImpl implements ElementJsonFileReference {
    constructor(
      private readonly elementJsonFile: ElementJsonFile,
      private readonly rustElementJsonFileReference: RustElementJsonFileReference,
    ) {}

    getElementJsonFile(): ElementJsonFile {
      return this.elementJsonFile
    }

    getUnderlyingElementJsonFileReference(): RustElementJsonFileReference {
      return this.rustElementJsonFileReference
    }

    toEtsFormat(): `app.${string}.${string}` {
      return this.rustElementJsonFileReference.toEtsFormat()
    }

    toJsonFormat(): `$${string}:${string}` {
      return this.rustElementJsonFileReference.toJsonFormat()
    }

    getUri(): Uri {
      return this.rustElementJsonFileReference.getElementJsonFile().getUri()
    }

    getStart(): number {
      return this.rustElementJsonFileReference.getNameStart()
    }

    getEnd(): number {
      return this.rustElementJsonFileReference.getNameEnd()
    }
  }

  export function is(value: unknown): value is ElementJsonFileReference {
    return value instanceof ElementJsonFileReferenceImpl
  }

  export function create(elementJsonFile: ElementJsonFile, rustElementJsonFileReference: RustElementJsonFileReference): ElementJsonFileReference {
    return new ElementJsonFileReferenceImpl(elementJsonFile, rustElementJsonFileReference)
  }
}
