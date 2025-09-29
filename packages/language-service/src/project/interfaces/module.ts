import type { Directory } from './file-system/file-system'
import type { ProjectBuildProfileFile } from './file/project-build-profile'
import type { ProjectOhPackageFile } from './file/project-oh-package'
import type { Product } from './product'
import type { Workspace } from './workspace'

/**
 * Single {@linkcode Workspace} contains multiple modules.
 *
 * As a basic functional unit of apps/atomic services, a module contains source
 * code, resource files, third-party libraries, and configuration files.
 *
 * It must contain the `build-profile.json5` and `oh-package.json5` files at the
 * project level, so the current module implementation provides
 * {@linkcode getProjectBuildProfile} and {@linkcode getProjectOhPackage} methods
 * to get their related information.
 *
 * @see https://developer.huawei.com/consumer/en/doc/harmonyos-guides/ide-hvigor-multi-module
 *
 * ---
 * 一个工作空间包含多个模块。
 *
 * 作为应用/原子服务的最小功能单元，模块包含源代码、资源文件、第三方库和配置文件。
 *
 * 它首先必须包含有工程级的`build-profile.json5` 和`oh-package.json5`文件，因
 * 此在当前模块实现中提供{@linkcode getProjectBuildProfile} 和 {@linkcode getProjectOhPackage}
 * 方法来获取它们的相关信息。
 *
 *
 * @see https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/ide-hvigor-multi-module
 */
export interface Module extends Directory {
  /**
   * Get the current workspace of the project.
   *
   * @returns The current workspace of the project.
   */
  getWorkspace(): Workspace
  /**
   * Get the project build profile of the module.
   *
   * @returns The project build profile of the module.
   */
  getProjectBuildProfile(): Promise<ProjectBuildProfileFile>
  /**
   * Get the project oh package of the module.
   *
   * @returns The project oh package of the module.
   */
  getProjectOhPackage(): Promise<ProjectOhPackageFile>
  /**
   * Find the products of the project.
   *
   * @param force - Whether to force the find, default is false. If true, the find will be performed again.
   * @returns The products of the project.
   */
  findProducts(force?: boolean): Promise<Product[]>
}
