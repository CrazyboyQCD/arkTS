import type { URI } from 'vscode-uri'

export interface Resetable {
  /**
   * Reset the state & clear the cache.
   */
  reset(): Promise<void>
}

export interface FileOrFolder {
  /**
   * Get the file or folder URI.
   */
  getUri(): URI
}
