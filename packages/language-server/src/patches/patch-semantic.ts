import type { CancellationToken, LanguageServicePlugin, Range, SemanticTokensLegend, TextDocument } from '@volar/language-server'

export function patchSemantic(typescriptServices: LanguageServicePlugin[]): void {
  const oldCreate = typescriptServices[0].create
  typescriptServices[0].create = (context) => {
    const instance = oldCreate(context)

    return {
      async provideDocumentSemanticTokens(document: TextDocument, range: Range, legend: SemanticTokensLegend, token: CancellationToken) {
        const semanticTokens = await instance.provideDocumentSemanticTokens?.(document, range, legend, token)
        return semanticTokens
      },
    }
  }
}
