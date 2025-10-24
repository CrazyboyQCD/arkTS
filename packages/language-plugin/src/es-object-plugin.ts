import type { ETSMacroPlugin, ETSVirtualCode } from './ets-code'

export function ESObjectPlugin(): ETSMacroPlugin {
  return {
    name: 'ets:es-object',
    resolveVirtualCode(virtualCode: ETSVirtualCode) {
      virtualCode.codes.push(
        `\n/**\n * 应该尽量不使用此类型。\n * ---\n * Should not use this type as much as possible. \n */ \n type ESObject = any`,
      )
      return virtualCode
    },
  }
}
