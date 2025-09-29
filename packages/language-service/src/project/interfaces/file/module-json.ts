import type { ModuleJson5 } from '@arkts/types'
import type { DeepPartial } from '../../../types/util'
import type { JsonLikeFile } from './json-like-file'

export interface ModuleJsonFile extends JsonLikeFile<DeepPartial<ModuleJson5>> {}
