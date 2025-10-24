import type { ProjectDetector as RustProjectDetector } from '@arkts/project-detector'
import type { Emitter } from 'mitt'
import { UriUtil } from '../utils/uri-util'
import { ProjectDetector } from './project-detector'

export interface ProjectDetectorManager extends Pick<Emitter<RustProjectDetector.EventMap>, 'emit'> {
  delete(workspaceFolder: string): void
  add(workspaceFolder: string): void
  findAll(): ProjectDetector[]
  findByUri(uri: string): ProjectDetector | undefined
}

export namespace ProjectDetectorManager {
  class ProjectDetectorManagerImpl implements ProjectDetectorManager {
    private readonly projectDetectors: ProjectDetector[] = []

    constructor(private readonly workspaceFolders: string[]) {
      for (const workspaceFolder of this.workspaceFolders) {
        this.add(workspaceFolder)
      }
    }

    delete(workspaceFolder: string): void {
      for (let index = 0; index < this.projectDetectors.length; index++) {
        if (this.projectDetectors[index].getUnderlyingProjectDetector().getWorkspaceFolder().fsPath === workspaceFolder) {
          this.projectDetectors.splice(index, 1)
          break
        }
      }
    }

    add(workspaceFolder: string): void {
      this.projectDetectors.push(ProjectDetector.create(this, workspaceFolder))
    }

    findAll(): ProjectDetector[] {
      return this.projectDetectors
    }

    findByUri(uri: string): ProjectDetector | undefined {
      return this.projectDetectors.find((projectDetector) => {
        const underlyingProjectDetector = projectDetector.getUnderlyingProjectDetector()
        return underlyingProjectDetector.getWorkspaceFolder().fsPath === uri
          || UriUtil.isContains(uri, underlyingProjectDetector.getWorkspaceFolder())
      })
    }

    emit(type: keyof RustProjectDetector.EventMap, event?: RustProjectDetector.EventMap[keyof RustProjectDetector.EventMap]): void {
      this.projectDetectors.forEach(projectDetector =>
        projectDetector.getUnderlyingProjectDetector()
          .emit(type, event as RustProjectDetector.EventMap[keyof RustProjectDetector.EventMap]),
      )
    }
  }

  export function create(workspaceFolders: string[]): ProjectDetectorManager {
    return new ProjectDetectorManagerImpl(workspaceFolders)
  }
}
