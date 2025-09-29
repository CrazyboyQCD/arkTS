import type { JsonLikeFile } from '../../interfaces/file/json-like-file'
import json5 from 'json5'
import { FileImpl } from '../common/file'

export abstract class JsonLikeFileImpl<T> extends FileImpl implements JsonLikeFile<T> {
  async safeParse(force: boolean = false): Promise<T> {
    return super.computedAsync('safeParse', async () => {
      const content = await this.readToString(force)
      return json5.parse(content)
    }, force)
  }

  getSourceFile(ets: typeof import('ohos-typescript'), force: boolean = false): Promise<import('ohos-typescript').JsonSourceFile> {
    return super.computedAsync('getSourceFile', async () => {
      const content = await this.readToString(force)
      return ets.parseJsonText(this.getUri().toString(), content)
    }, force)
  }
}
