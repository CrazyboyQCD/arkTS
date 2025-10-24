import type { Position } from '@volar/language-server/node'
import type * as ets from 'ohos-typescript'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import { LEADING_TRAILING_QUOTE_REGEX } from '../utils/regex'

export class GlobalCallExpressionFinder {
  constructor(private readonly ets: typeof import('ohos-typescript')) {}

  findGlobalCallExpression(sourceFile: ets.SourceFile, identifier: string): import('ohos-typescript').CallExpression[] {
    const globalCallExpressions: import('ohos-typescript').CallExpression[] = []

    const collectAllCallExpressions = (node: ets.Node): void => {
      if (!this.ets.isCallExpression(node)) {
        return this.ets.forEachChild(node, collectAllCallExpressions)
      }

      if (node.expression.getText(sourceFile) !== identifier) {
        return this.ets.forEachChild(node, collectAllCallExpressions)
      }

      globalCallExpressions.push(node)
      return this.ets.forEachChild(node, collectAllCallExpressions)
    }

    if (this.hasLocalDeclaration(sourceFile, identifier)) return []
    collectAllCallExpressions(sourceFile)
    return globalCallExpressions
  }

  isInCallExpression(callExpressions: import('ohos-typescript').CallExpression[], sourceFile: ets.SourceFile, textDocument: TextDocument, position: Position): import('ohos-typescript').CallExpression | undefined {
    return callExpressions.find(resourceCallExpression =>
      textDocument.offsetAt(position) >= resourceCallExpression.getStart(sourceFile)
      && textDocument.offsetAt(position) <= resourceCallExpression.getEnd(),
    )
  }

  hasLocalDeclaration(node: ets.Node, identifier: string): true | undefined {
    // Import声明
    if (this.ets.isImportDeclaration(node)) {
      const importClause = node.importClause
      if (importClause) {
        if (importClause.namedBindings && this.ets.isNamedImports(importClause.namedBindings)) {
          for (const element of importClause.namedBindings.elements) {
            if (element.name.text === identifier) {
              return true
            }
          }
        }
        if (importClause.name && importClause.name.text === identifier) {
          return true
        }
      }
    }

    // 变量声明
    if (this.ets.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (this.ets.isIdentifier(declaration.name) && declaration.name.text === identifier) {
          return true
        }
      }
    }

    // 函数声明
    if (this.ets.isFunctionDeclaration(node) && node.name && node.name.text === identifier) {
      return true
    }

    // 类声明
    if (this.ets.isClassDeclaration(node) && node.name && node.name.text === identifier) {
      return true
    }

    return this.ets.forEachChild(node, child => this.hasLocalDeclaration(child, identifier))
  }

  getFirstArgumentText(callExpression: import('ohos-typescript').CallExpression, sourceFile: ets.SourceFile): string | undefined {
    if (!callExpression.arguments || callExpression.arguments.length === 0 || !callExpression.arguments[0]) return undefined
    if (!this.ets.isStringLiteral(callExpression.arguments[0])) return undefined
    return callExpression.arguments[0].getText(sourceFile).replace(LEADING_TRAILING_QUOTE_REGEX, '')
  }
}
