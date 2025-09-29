import type { Range, TextDocument } from 'vscode-languageserver-textdocument'
import type { File } from './file-system/file-system'

/**
 * {@linkcode Resetable} represents a resetable instance with cache.
 *
 * ---
 *
 * {@linkcode Resetable} 代表一个可重置缓存的实例。
 */
export interface Resetable {
  /**
   * Reset the current instance cache.
   *
   * @param key - The key to reset. If not provided, all cache will be reset.
   */
  reset(key?: keyof this | Array<keyof this>): void
}

/**
 * A reference in the file.
 *
 * ---
 *
 * {@linkcode Reference} 代表一个文件中的引用。
 */
export interface Reference {
  /**
   * Get the file of the reference.
   *
   * @returns The file of the reference.
   */
  getFile(): File
  /**
   * Get the range of the reference.
   *
   * @returns The range of the reference.
   */
  getRange(): Range
  /**
   * Get the text of the reference.
   *
   * @returns The text of the reference.
   */
  getText(): string
  /**
   * Get the text document of the reference.
   *
   * @returns The text document of the reference.
   */
  getTextDocument(): TextDocument
}

/**
 * {@linkcode FullableReference} represents a fullable reference.
 *
 * For example, if a reference is a `json` file reference, when the following
 * methods are implemented, it means that the original {@linkcode getText}
 * and {@linkcode getRange} methods return a part that does not contain the
 * leading and trailing quotes, while the {@linkcode getFullText} and
 * {@linkcode getFullRange} methods return a part that contains the leading
 * and trailing quotes.
 *
 * ---
 *
 * {@linkcode FullableReference} 代表一个可获取完整范围和文本的引用。
 *
 * 比如`json`文件中的引用，当实现下列方法时则表示原本的{@linkcode getText}和
 * {@linkcode getRange}方法返回的是一个不包含前后引号的部分，而{@linkcode getFullText}
 * 和{@linkcode getFullRange}方法返回的是一个包含前后引号的部分。
 */
export interface FullableReference extends Reference {
  /**
   * Get the full range of the name reference.
   *
   * @returns The full range of the name reference.
   */
  getFullRange(): Range
  /**
   * Get the full text of the name reference.
   *
   * @returns The full text of the name reference.
   */
  getFullText(): string
}

export interface PathableReference extends Reference {
  /**
   * Get `.ets` format path of the reference, like: `app.media.icon`.
   */
  getEtsPath(): PathableReference.EtsPath
  /**
   * Get `.json5` format path of the reference, like: `$media:icon`.
   */
  getJson5Path(): PathableReference.Json5Path
}

export namespace PathableReference {
  export type EtsPath = `${string}.${string}.${string}`
  export type Json5Path = `$${string}:${string}`
}
