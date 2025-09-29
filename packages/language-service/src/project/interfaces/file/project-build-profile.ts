import type { ProjectLevelBuildProfile } from '@arkts/types'
import type { DeepPartial } from 'packages/language-service/src/types/util'
import type { URI } from 'vscode-uri'
import type { Module } from '../module'
import type { JsonLikeFile } from './json-like-file'

export interface ProjectBuildProfileFile extends JsonLikeFile<DeepPartial<ProjectLevelBuildProfile>> {
  /**
   * Get the current project of the project build profile.
   *
   * @returns The current project of the project build profile.
   */
  getModule(): Module
  /**
   * Get the products of the project build profile.
   *
   * @returns The products of the project build profile.
   */
  getTargets(force?: boolean): Promise<ProjectLevelBuildProfile.Target[]>
  /**
   * Get the target names of the project build profile.
   *
   * @param force - Whether to force the get, default is false. If true, the get will be performed again.
   * @returns The target names of the project build profile.
   */
  getTargetNames(force?: boolean): Promise<string[]>
  /**
   * Get the resource directories of the project build profile by target name.
   *
   * - If the field is not configured, the default value is `["src/main/resources"]`.
   * - If the target name is not `default` & the field is not configured, the default value is `["src/{TARGET_NAME}/resources"]`.
   * - If the target name not found, return undefined.
   *
   * @param targetName - The target name.
   * @param force - Whether to force the get, default is false. If true, the get will be performed again.
   * @returns The resource directories of the project build profile by target name.
   */
  getResourceDirectoriesByTargetName(targetName: string, force?: boolean): Promise<URI[] | undefined>
}
