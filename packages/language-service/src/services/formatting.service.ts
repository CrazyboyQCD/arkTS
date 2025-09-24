import type { LanguageServicePlugin } from '@volar/language-service'
import type * as ets from 'ohos-typescript'
import { Range } from '@volar/language-server/node'
import { ContextUtil } from '../utils/context-util'

export function createETSFormattingService(): LanguageServicePlugin {
  return {
    name: 'arkts-formatting',
    capabilities: {
      documentFormattingProvider: true,
    },
    create(context) {
      return {
        provideDocumentFormattingEdits(document, _range) {
          const ctx = new ContextUtil(context)
          const languageService = ctx.getLanguageService()
          const sourceFile = ctx.decodeSourceFile(document)
          if (!languageService || !sourceFile)
            return []

          const textChanges = languageService.getFormattingEditsForDocument(sourceFile.fileName, {
            baseIndentSize: 0,
            indentSize: 2,
            tabSize: 2,
            newLineCharacter: ';',
            convertTabsToSpaces: true,
            indentStyle: 2 as ets.IndentStyle.Smart,
            trimTrailingWhitespace: true,
            insertSpaceAfterCommaDelimiter: true,
            insertSpaceAfterSemicolonInForStatements: true,
            insertSpaceBeforeAndAfterBinaryOperators: true,
            insertSpaceAfterConstructor: false,
            insertSpaceAfterKeywordsInControlFlowStatements: true,
            insertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
            insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
            insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
            insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: false,
            insertSpaceAfterOpeningAndBeforeClosingEmptyBraces: false,
            insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: true,
            insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: true,
            insertSpaceAfterTypeAssertion: false,
            insertSpaceBeforeFunctionParenthesis: false,
            placeOpenBraceOnNewLineForFunctions: false,
            placeOpenBraceOnNewLineForControlBlocks: false,
            insertSpaceBeforeTypeAnnotation: true,
            indentMultiLineObjectLiteralBeginningOnBlankLine: false,
            semicolons: 'ignore' as ets.SemicolonPreference.Ignore,
          })

          return textChanges.map(change => ({
            range: Range.create(
              document.positionAt(change.span.start),
              document.positionAt(change.span.start + change.span.length),
            ),
            newText: change.newText,
          }))
        },
      }
    },
  }
}
