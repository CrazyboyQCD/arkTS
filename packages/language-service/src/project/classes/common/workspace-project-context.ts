import type { ProjectLevelBuildProfile, ProjectLevelOhPackageJson5, WorkspaceLevelBuildProfile, WorkspaceLevelOhPackage5 } from 'packages/types/out'
import type { FileSystemAdapter } from '../../interfaces/file-system/file-system-adapter'
import json5 from 'json5'
import { URI, Utils } from 'vscode-uri'
import { Cacheable } from './cacheable'

export interface BuildProfileInfo {
  /**
   * The path of the build-profile.json5.
   *
   * If the build-profile.json5 is not exist, the value will be false.
   */
  buildProfilePath: URI
  /**
   * The path of the project.
   */
  projectPath: URI
  /**
   * The content of the build-profile.json5.
   */
  buildProfileContent: string
  /**
   * The parsed content of the build-profile.json5.
   * If the build-profile.json5 is not exist, the value will be false.
   */
  parsedBuildProfileContent: WorkspaceLevelBuildProfile | ProjectLevelBuildProfile
  /**
   * The path of the oh-package.json5.
   */
  ohPackagePath: URI | false
  /**
   * The content of the oh-package.json5.
   */
  ohPackageContent: string | false
  /**
   * The parsed content of the oh-package.json5.
   */
  parsedOhPackageContent: WorkspaceLevelOhPackage5 | ProjectLevelOhPackageJson5 | false
}

/**
 * {@linkcode WorkspaceModuleContext} represents a workspace-module context.
 *
 * A workspace-module context is used to share the private information of the
 * {@linkcode Workspace} and {@linkcode Module}, to prevent the performance
 * problem caused by repeated reading of content from the file system.
 *
 * This class is only used for internal use and should not be directly instantiated and exported.
 *
 * ---
 *
 * {@linkcode WorkspaceModuleContext} 代表一个工作空间-模块上下文。它将共享{@linkcode Workspace}
 * 和{@linkcode Module}的私有信息，以防止重复从文件系统中读取内容导致性能问题。
 *
 * 此类的实现仅用于内部使用，不应该被直接实例化和导出。
 *
 * @private
 */
export abstract class WorkspaceModuleContext extends Cacheable {
  abstract getFileSystem(): Promise<FileSystemAdapter>
  abstract getWorkspaceFolder(): URI

  /**
   * Read and parse the `oh-package.json5` and `build-profile.json5` in one time.
   *
   * @param force - Whether to force the read, default is false. If true, the read will be performed again.
   */
  readBuildProfileInfo(force: boolean = false): Promise<BuildProfileInfo[]> {
    return super.computedAsync('readBuildProfileInfo', async () => {
      const fileSystem = await this.getFileSystem()
      const globPattern = Utils.joinPath(this.getWorkspaceFolder(), '**', 'build-profile.json5')
      const ohPackageWithBuildProfile: BuildProfileInfo[] = []

      const buildProfileJson5Files = await fileSystem.glob(globPattern.fsPath, {
        absolute: true,
        onlyFiles: true,
        ignore: [
          '**/node_modules/**',
          '**/oh_modules/**',
          '**/.git/**',
          '**/.vscode/**',
          '**/.idea/**',
          '**/.svn/**',
        ],
      })

      for (const buildProfileJson5Path of buildProfileJson5Files) {
        try {
          const buildProfilePath = URI.file(buildProfileJson5Path)
          const projectPath = Utils.dirname(buildProfilePath)
          const ohPackageJson5Path = Utils.joinPath(projectPath, 'oh-package.json5')
          const isOhPackageExist = await fileSystem.exists(ohPackageJson5Path) && (await fileSystem.stat(ohPackageJson5Path)).isFile()
          const buildProfileContent = await fileSystem.readFileToString(buildProfilePath)

          ohPackageWithBuildProfile.push({
            buildProfilePath,
            projectPath,
            buildProfileContent,
            parsedBuildProfileContent: json5.parse(buildProfileContent),
            ohPackagePath: isOhPackageExist ? ohPackageJson5Path : false,
            ohPackageContent: isOhPackageExist ? await fileSystem.readFileToString(ohPackageJson5Path) : false,
            parsedOhPackageContent: isOhPackageExist ? json5.parse(await fileSystem.readFileToString(ohPackageJson5Path)) : false,
          })
        }
        catch {}
      }

      return ohPackageWithBuildProfile
    }, force)
  }
}
