import type { Directory } from '../file-system/file-system'

export interface ResourceDirectory extends Directory {
  /**
   * The kind of the resource directory.
   */
  readonly resourceDirectoryKind: ResourceDirectory.Kind
}

export namespace ResourceDirectory {
  export enum Kind {
    /**
     * Represent the `rawfile directory.
     *
     * @see https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/resource-categories-and-access#资源目录
     */
    RawFile = 'rawfile',
    /**
     * Represent the `resfile` directory.
     *
     * @see https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/resource-categories-and-access#资源目录
     */
    ResFile = 'resfile',
    /**
     * Represent the resource group directory, such as `base`, `zh-CN`, `dark`, etc.
     *
     * @see https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/resource-categories-and-access#资源组目录
     */
    ResourceGroup = 'resource-group',
  }
}
