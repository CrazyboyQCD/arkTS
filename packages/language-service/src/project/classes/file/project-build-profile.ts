import type { ProjectLevelBuildProfile } from '@arkts/types'
import type { DeepPartial } from 'packages/language-service/src/types/util'
import type { URI } from 'vscode-uri'
import type { FileSystemAdapter } from '../../interfaces/file-system/file-system-adapter'
import type { ProjectBuildProfileFile } from '../../interfaces/file/project-build-profile'
import type { Module } from '../../interfaces/module'
import type { TextDocumentUpdater } from '../../interfaces/project-detector'
import { Utils } from 'vscode-uri'
import { JsonLikeFileImpl } from './json-like-file'

export class ProjectBuildProfileFileImpl extends JsonLikeFileImpl<DeepPartial<ProjectLevelBuildProfile>> implements ProjectBuildProfileFile {
  constructor(
    private readonly module: Module,
    private readonly uri: URI,
  ) {
    super()
  }

  getUri(): URI {
    return this.uri
  }

  getFileSystem(): Promise<FileSystemAdapter> {
    return this.module.getFileSystem()
  }

  getTextDocumentUpdater(): TextDocumentUpdater {
    return this.module.getTextDocumentUpdater()
  }

  getModule(): Module {
    return this.module
  }

  getTargets(force: boolean = false): Promise<ProjectLevelBuildProfile.Target[]> {
    return super.computedAsync('getTargets', async () => {
      const buildProfile = await this.safeParse(force)

      const targets: ProjectLevelBuildProfile.Target[] = []

      for (const target of buildProfile.targets ?? []) {
        if (target) targets.push(target as ProjectLevelBuildProfile.Target)
      }

      return (buildProfile.targets ?? []) as ProjectLevelBuildProfile.Target[]
    }, force)
  }

  getTargetNames(force: boolean = false): Promise<string[]> {
    return super.computedAsync('getTargetNames', async () => {
      const targets = await this.getTargets(force)
      return targets.map(target => target.name)
    }, force)
  }

  getResourceDirectoriesByTargetName(targetName: string, force?: boolean): Promise<URI[] | undefined> {
    return super.computedAsync('getResourceDirectoriesByTargetName', async () => {
      const buildProfile = await this.safeParse(force)
      const resourceDirectories: URI[] = []

      const targetConfig = buildProfile.targets?.find(target => target?.name === targetName)
      if (!targetConfig) return
      const targetResourceDirectories = (targetConfig.resource?.directories ?? []) as string[]

      if (targetResourceDirectories.length === 0) {
        if (targetName === 'default') {
          resourceDirectories.push(Utils.joinPath(this.getModule().getUri(), 'src', 'main', 'resources'))
        }
        else {
          resourceDirectories.push(Utils.joinPath(this.getModule().getUri(), 'src', targetName, 'resources'))
        }
      }
      else {
        for (const directory of targetResourceDirectories) {
          resourceDirectories.push(Utils.joinPath(this.getModule().getUri(), directory))
        }
      }

      return resourceDirectories
    }, force)
  }
}
