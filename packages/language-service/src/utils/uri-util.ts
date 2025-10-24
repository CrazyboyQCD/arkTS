import type { URI } from 'vscode-uri'

export namespace UriUtil {
  export function isContains<CompareFolderUri extends Partial<URI> & Pick<URI, 'fsPath' | 'toString' | 'path'>>(uriStr: string, compareFolderUri: CompareFolderUri): boolean {
    return uriStr.startsWith(compareFolderUri.fsPath)
      || uriStr.startsWith(compareFolderUri.toString())
      || uriStr.startsWith(compareFolderUri.path)
  }
}
