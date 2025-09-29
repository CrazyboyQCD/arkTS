import type { ProjectLevelOhPackageJson5 } from '@arkts/types'
import type { DeepPartial } from '../../../types/util'
import type { Module } from '../module'
import type { JsonLikeFile } from './json-like-file'

export interface ProjectOhPackageFile extends JsonLikeFile<DeepPartial<ProjectLevelOhPackageJson5>> {
  /**
   * Get the current project of the project oh package.
   *
   * @returns The current project of the project oh package.
   */
  getModule(): Module
}
