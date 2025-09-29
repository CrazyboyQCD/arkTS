import type { Directory } from './file-system/file-system'
import type { WorkspaceBuildProfileFile } from './file/workspace-build-profile'
import type { WorkspaceOhPackageFile } from './file/workspace-oh-package'
import type { Module } from './module'
import type { ProjectDetector } from './project-detector'

/**
 * {@linkcode Workspace} represents a `hvigor` project.
 *
 * Hvigor is a build task orchestration tool based on TypeScript, which mainly
 * provides task management mechanisms, including task registration orchestration,
 * project model management, configuration management, and provides specific
 * processes and configurable settings for building and testing applications.
 *
 * @see https://developer.huawei.com/consumer/en/doc/harmonyos-guides/ide-hvigor
 *
 * ---
 *
 * {@linkcode Workspace} 代表一个`hvigor`工程。
 *
 * 编译构建工具 Hvigor 是一款基于TypeScript实现的构建任务编排工具，主要提供任务
 * 管理机制，包括任务注册编排、工程模型管理、配置管理等关键能力，提供专用于构建
 * 和测试应用的流程和可配置设置。
 *
 * @see https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/ide-hvigor
 */
export interface Workspace extends Directory {
  /**
   * Get the project detector of the workspace.
   *
   * @returns The project detector of the workspace.
   */
  getProjectDetector(): ProjectDetector
  /**
   * Find the projects of the workspace.
   *
   * @param force - Whether to force the find, default is false. If true, the find will be performed again.
   * @returns The projects of the workspace.
   */
  findModules(force?: boolean): Promise<Module[]>
  /**
   * Get the workspace build profile of the workspace.
   *
   * @returns The workspace build profile of the workspace.
   */
  getWorkspaceBuildProfile(): Promise<WorkspaceBuildProfileFile>
  /**
   * Get the workspace oh package of the workspace.
   *
   * @returns The workspace oh package of the workspace.
   */
  getWorkspaceOhPackage(): Promise<WorkspaceOhPackageFile>
}
