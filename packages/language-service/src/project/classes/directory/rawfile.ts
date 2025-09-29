import type { RawFile } from '../../interfaces/directory/rawfile'
import { ResourceDirectory } from '../../interfaces/directory/resource-directory'
import { ResourceDirectoryImpl } from './resource-directory'

export class RawFileImpl extends ResourceDirectoryImpl implements RawFile {
  readonly resourceDirectoryKind = ResourceDirectory.Kind.RawFile
}
