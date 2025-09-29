import type { WorkspaceLevelOhPackage5 } from '@arkts/types'
import type { DeepPartial } from 'packages/language-service/src/types/util'
import type { Workspace } from '../workspace'
import type { JsonLikeFile } from './json-like-file'

export interface WorkspaceOhPackageFile extends JsonLikeFile<DeepPartial<WorkspaceLevelOhPackage5>> {
  /**
   * Get the workspace of the workspace build profile.
   *
   * @returns The workspace of the workspace build profile.
   */
  getWorkspace(): Workspace
}
