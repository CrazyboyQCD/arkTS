import type { FileSystemAdapter } from './interfaces/file-system/file-system-adapter'
import type { ProjectDetector } from './interfaces/project-detector'
import { ProjectDetectorImpl } from './classes/project-detector'

export function createProjectDetector(workspaceFolder: string, fileSystem?: FileSystemAdapter): ProjectDetector {
  return new ProjectDetectorImpl(workspaceFolder, fileSystem)
}
