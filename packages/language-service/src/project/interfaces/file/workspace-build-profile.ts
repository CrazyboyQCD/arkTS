import type { WorkspaceLevelBuildProfile } from '@arkts/types'
import type { DeepPartial } from 'packages/language-service/src/types/util'
import type { URI } from 'vscode-uri'
import type { Workspace } from '../workspace'
import type { JsonLikeFile } from './json-like-file'

export interface WorkspaceBuildProfileFile extends JsonLikeFile<DeepPartial<WorkspaceLevelBuildProfile>> {
  /**
   * Get the workspace of the workspace build profile.
   *
   * @returns The workspace of the workspace build profile.
   */
  getWorkspace(): Workspace
  /**
   * Get the module paths of the workspace build profile.
   *
   * @param force - Whether to force the get, default is false. If true, the get will be performed again.
   * @returns The module paths of the workspace build profile.
   */
  getModulePaths(force?: boolean): Promise<URI[]>
}
