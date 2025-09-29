import type { ResFile } from '../../interfaces/directory/resfile'
import { ResourceDirectory } from '../../interfaces/directory/resource-directory'
import { ResourceDirectoryImpl } from './resource-directory'

export class ResFileImpl extends ResourceDirectoryImpl implements ResFile {
  readonly resourceDirectoryKind = ResourceDirectory.Kind.ResFile
}
