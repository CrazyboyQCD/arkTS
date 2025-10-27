import * as ets from 'ohos-typescript'

/**
 * 将 span 格式的分类结果转换回编码格式（用于 getEncodedSemanticClassifications）
 *
 * 支持两种格式：
 * 1. ClassifiedSpan: { textSpan, classificationType: string }
 * 2. ClassifiedSpan2020: { textSpan, classificationType: number }
 *
 * 格式转换：
 * 输入: [{ textSpan: { start, length }, classificationType: string | number }]
 * 输出: { spans: [offset, length, typeNum, ...], endOfLineState: number }
 */
export function convertSpansToClassifications(
  spans: readonly (ets.ClassifiedSpan | ets.ClassifiedSpan2020)[],
): ets.Classifications {
  const result: number[] = []

  for (const span of spans) {
    result.push(span.textSpan.start) // offset
    result.push(span.textSpan.length) // length

    // 如果是数字类型（ClassifiedSpan2020），直接使用
    // 如果是字符串类型（ClassifiedSpan），需要转换为数字
    if (typeof span.classificationType === 'number') {
      result.push(span.classificationType)
    }
    else {
      result.push(getClassificationTypeCode(span.classificationType))
    }
  }

  return {
    spans: result,
    endOfLineState: 0, // EndOfLineState.None
  }
}

/**
 * 分类类型名称到数字编码的映射
 * 使用 ohos-typescript 内置的枚举值，确保类型安全和一致性
 */
const typeMap = new Map<string, number>([
  [ets.ClassificationTypeNames.comment, ets.ClassificationType.comment],
  [ets.ClassificationTypeNames.identifier, ets.ClassificationType.identifier],
  [ets.ClassificationTypeNames.keyword, ets.ClassificationType.keyword],
  [ets.ClassificationTypeNames.numericLiteral, ets.ClassificationType.numericLiteral],
  [ets.ClassificationTypeNames.bigintLiteral, ets.ClassificationType.bigintLiteral],
  [ets.ClassificationTypeNames.operator, ets.ClassificationType.operator],
  [ets.ClassificationTypeNames.stringLiteral, ets.ClassificationType.stringLiteral],
  [ets.ClassificationTypeNames.whiteSpace, ets.ClassificationType.whiteSpace],
  [ets.ClassificationTypeNames.text, ets.ClassificationType.text],
  [ets.ClassificationTypeNames.punctuation, ets.ClassificationType.punctuation],
  [ets.ClassificationTypeNames.className, ets.ClassificationType.className],
  [ets.ClassificationTypeNames.enumName, ets.ClassificationType.enumName],
  [ets.ClassificationTypeNames.interfaceName, ets.ClassificationType.interfaceName],
  [ets.ClassificationTypeNames.moduleName, ets.ClassificationType.moduleName],
  [ets.ClassificationTypeNames.typeParameterName, ets.ClassificationType.typeParameterName],
  [ets.ClassificationTypeNames.typeAliasName, ets.ClassificationType.typeAliasName],
  [ets.ClassificationTypeNames.parameterName, ets.ClassificationType.parameterName],
  [ets.ClassificationTypeNames.docCommentTagName, ets.ClassificationType.docCommentTagName],
  [ets.ClassificationTypeNames.jsxOpenTagName, ets.ClassificationType.jsxOpenTagName],
  [ets.ClassificationTypeNames.jsxCloseTagName, ets.ClassificationType.jsxCloseTagName],
  [ets.ClassificationTypeNames.jsxSelfClosingTagName, ets.ClassificationType.jsxSelfClosingTagName],
  [ets.ClassificationTypeNames.jsxAttribute, ets.ClassificationType.jsxAttribute],
  [ets.ClassificationTypeNames.jsxText, ets.ClassificationType.jsxText],
  [ets.ClassificationTypeNames.jsxAttributeStringLiteralValue, ets.ClassificationType.jsxAttributeStringLiteralValue],
])

function getClassificationTypeCode(typeName: string | undefined): number {
  return typeName ? typeMap.get(typeName) ?? 0 : 0
}
