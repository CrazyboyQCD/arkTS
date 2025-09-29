import type { Element } from '../../interfaces/directory/element'
import type { ResourceGroup } from '../../interfaces/directory/resource-group'
import { ResourceDirectory } from '../../interfaces/directory/resource-directory'
import { ElementImpl } from './element'
import { ResourceDirectoryImpl } from './resource-directory'

export class ResourceGroupImpl extends ResourceDirectoryImpl implements ResourceGroup {
  readonly resourceDirectoryKind = ResourceDirectory.Kind.ResourceGroup

  getElement(force?: boolean): Promise<Element> {
    return super.computedAsync('getElement', async () => new ElementImpl(this), force)
  }
}
