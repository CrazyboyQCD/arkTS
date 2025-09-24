import { typeAssert } from '@arkts/shared'

/** 深度移除`DocumentSymbol`中的空值。 */
export function deepRemoveFalsyValue(documentSymbol: import('@volar/language-server').DocumentSymbol): import('@volar/language-server').DocumentSymbol | undefined {
  for (const key in documentSymbol) {
    typeAssert<keyof typeof documentSymbol>(key)
    if (key === 'name' && !documentSymbol[key])
      return undefined
  }

  return {
    ...documentSymbol,
    children: documentSymbol.children?.map(child => deepRemoveFalsyValue(child))
      .filter(child => child !== undefined) || [],
  }
}
