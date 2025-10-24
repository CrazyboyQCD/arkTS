import type { ElementJsonFileReference as RustElementJsonFileReference } from '@arkts/project-detector'
import type { ElementJsonFile } from './element-json-file'

export interface ElementJsonFileReference {
  getElementJsonFile(): ElementJsonFile
  getUnderlyingElementJsonFileReference(): RustElementJsonFileReference
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
  }

  export function create(elementJsonFile: ElementJsonFile, rustElementJsonFileReference: RustElementJsonFileReference): ElementJsonFileReference {
    return new ElementJsonFileReferenceImpl(elementJsonFile, rustElementJsonFileReference)
  }
}
