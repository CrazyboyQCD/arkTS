import type { LanguageServicePlugin } from '@volar/language-server'
import type { ArkTSExtraLanguageService } from '../language-service'
import type { LocaleStorage } from '../utils/i18n'
import { MarkupKind } from '@volar/language-server'
import { ContextUtil } from '../utils/context-util'
import { simpleTranslate } from '../utils/i18n'

/** 给 $$this 提供注释，说明$$this语法是用来干啥的，提供markdown文档悬浮到hover处。 */
export function createETS$$ThisService(service: ArkTSExtraLanguageService): LanguageServicePlugin {
  const locale = service.getLocale()
  const $$thisHoverText: LocaleStorage = {
    zh: `$$运算符为系统组件提供TS变量的引用, 使得TS变量和系统组件的内部状态保持同步。详见: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-two-way-sync`,
    default: `$$ operator provides a reference to the TS variable for system components, keeping the TS variable synchronized with the internal state of the system component. See: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-two-way-sync`,
  }

  return {
    name: 'arkts-$$this',
    capabilities: {
      hoverProvider: true,
    },
    create(context) {
      const contextUtil = new ContextUtil(context)

      return {
        provideHover(document, position) {
          const sourceFile = contextUtil.getOriginalSourceFile(document)
          if (!sourceFile)
            return null

          const positions = service.get$$ThisPositions(sourceFile, document)
          // 遍历使用 AST 计算出的 $$this 位置，判断是否命中当前光标
          const positionOffset = document.offsetAt(position)
          for (const range of positions) {
            const startOffset = document.offsetAt(range.start)
            const endOffset = document.offsetAt(range.end)
            if (positionOffset >= startOffset && positionOffset <= endOffset) {
              return {
                contents: {
                  kind: MarkupKind.Markdown,
                  value: simpleTranslate(locale, $$thisHoverText),
                },
                range,
              }
            }
          }

          return null
        },
      }
    },
  }
}
