import type { File } from '../file-system/file-system'

export interface JsonLikeFile<T> extends File {
  /**
   * Safe parse the file content as a JSON object. If the file is updated, will return the updated content.
   *
   * @param force - Whether to force the parse, default is false. If true, the parse will be performed again.
   * @returns The JSON object.
   */
  safeParse(force?: boolean): Promise<T>
  /**
   * Get the source file of the JSON like file.
   *
   * @param ets - The ETS instance.
   * @param force - Whether to force the get, default is false. If true, the get will be performed again.
   * @returns The source file.
   */
  getSourceFile(ets: typeof import('ohos-typescript'), force?: boolean): Promise<import('ohos-typescript').JsonSourceFile>
}
