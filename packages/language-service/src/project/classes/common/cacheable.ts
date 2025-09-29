import type { Resetable } from '../../interfaces/common'

/**
 * {@linkcode Cacheable} represents a cacheable instance.
 *
 * A cacheable instance provides two methods to calculate the result, one for caching
 * synchronous results, and one for caching asynchronous results. The cached content
 * will be stored in an {@linkcode Map} instance of the instance.
 *
 * This class is only used for internal use and should not be directly instantiated and exported.
 *
 * ---
 *
 * {@linkcode Cacheable} 代表一个可缓存的实例。它提供两个方法来计算结果，一个适用于
 * 缓存同步结果，一个适用于缓存异步结果。被缓存的内容将存储在实例的一个{@linkcode Map}中。
 * 可以通过{@linkcode getCacheStorage}方法获取到该Map。
 *
 * 此类的实现仅用于内部使用，不应该被直接实例化和导出。
 *
 * @private
 */
export abstract class Cacheable implements Resetable {
  private _cacheStorage: Map<keyof this, unknown> = new Map()

  protected computedSync<Key extends keyof this, Result = Cacheable.CacheableResult<this[Key]>>(key: Key, fn: () => Result, force: boolean = false): Result {
    if (this._cacheStorage.has(key) && !force) return this._cacheStorage.get(key) as Result
    const value = fn()
    this._cacheStorage.set(key, value)
    return value as Result
  }

  protected async computedAsync<Key extends keyof this, Result = Cacheable.CacheableResult<this[Key]>>(key: Key, fn: () => Promise<Result>, force: boolean = false): Promise<Result> {
    if (this._cacheStorage.has(key) && !force) return this._cacheStorage.get(key) as Promise<Result>
    const value = await fn()
    this._cacheStorage.set(key, value)
    return value as Promise<Result>
  }

  /**
   * Get the cache storage.
   *
   * @returns The cache storage.
   */
  getCacheStorage(): Map<keyof this, unknown>
  /**
   * Get the cache storage.
   *
   * @template Constructor - The constructor of current class. If you want to
   * get full type safety please pass the constructor of current class to the
   * first template parameter.
   * @returns The cache storage.
   */
  getCacheStorage<Constructor>(): Cacheable.CacheMap<Constructor>
  getCacheStorage<Constructor = this>(): Cacheable.CacheMap<Constructor> | Map<keyof this, unknown> {
    return this._cacheStorage as Cacheable.CacheMap<Constructor>
  }

  reset(key?: keyof this | Array<keyof this>): void {
    if (!key) return this._cacheStorage.clear()

    if (Array.isArray(key)) {
      for (const k of key) this._cacheStorage.delete(k)
    }
    else {
      this._cacheStorage.delete(key)
    }
  }
}

export namespace Cacheable {
  export type CacheableResult<T> = T extends (...args: any[]) => any ? ReturnType<T> : T
  export type CacheResult<T> = T extends (...args: any[]) => any ? Awaited<ReturnType<T>> : T
  export type CacheValue<T> = T extends (...args: any[]) => Promise<infer R> ? R
    : T extends (...args: any[]) => infer R ? R
      : T extends string ? string
        : T

  export interface CacheMap<Object> extends Map<keyof Object, CacheValue<Object[keyof Object]>> {
    set<Key extends keyof Object>(key: Key, value: CacheValue<Object[Key]>): this
    get<Key extends keyof Object>(key: Key): CacheValue<Object[Key]>
  }

}
