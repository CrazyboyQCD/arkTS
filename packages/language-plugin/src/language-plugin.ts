import type { LanguagePlugin, VirtualCode } from '@volar/language-core'
import type * as ets from 'ohos-typescript'
import type * as ts from 'typescript'
import type { URI } from 'vscode-uri'
import path from 'node:path'
import { $$thisFixerPlugin } from './$$this-fixer-plugin'
import { createEmptyVirtualCode, createVirtualCode, ETSVirtualCode } from './ets-code'

function isEts(tsOrEts: typeof ets | typeof ts): tsOrEts is typeof ets {
  return 'ETS' in tsOrEts.ScriptKind && tsOrEts.ScriptKind.ETS === 8
}

export interface ETSLanguagePluginOptions {
  /**
   * Paths excluded from virtual code. It is very useful when you want to disable files in the `openharmony` & `hms` sdk.
   */
  excludePaths?: string[]
  /**
   * The path to the `tsdk`.
   *
   * Declaration files located within the `tsdk`, such as type declarations in the `lib.dom.d.ts`, are
   * incompatible with the `openharmony` & `hms` sdk and can interfere with it. A series of diagnostics
   * should be specified for the `tsdk` path to eliminate incompatibility.
   */
  tsdk?: string
}

/**
 * This {@linkcode ETSLanguagePlugin} is used to create the virtual code for the ETS and TS files.
 *
 * It supports the typescript-plugin-side & language-server-side.
 *
 * @see Structure of the virtual code: https://github.com/ohosvscode/arkTS/issues/36#issuecomment-2977236063
 * @param tsOrEts If passed {@linkcode ets} means current mode is language-server-side, otherwise is typescript-plugin-side.
 * @param options - The options for the plugin. See: {@linkcode ETSLanguagePluginOptions}
 */
export function ETSLanguagePlugin(tsOrEts: typeof ts, options?: ETSLanguagePluginOptions): LanguagePlugin<URI | string>
export function ETSLanguagePlugin(tsOrEts: typeof ets, options?: ETSLanguagePluginOptions): LanguagePlugin<URI | string>
export function ETSLanguagePlugin(tsOrEts: typeof ets | typeof ts, { excludePaths = [], tsdk = '' }: ETSLanguagePluginOptions = {}): LanguagePlugin<URI | string> {
  const isETSServerMode = isEts(tsOrEts)
  const isTSPluginMode = !isETSServerMode

  // full feature virtual code
  const getFullVirtualCode = (snapshot: ts.IScriptSnapshot, languageId: string): VirtualCode => (
    createVirtualCode(snapshot, languageId, {
      completion: true,
      format: true,
      navigation: true,
      semantic: true,
      structure: true,
      verification: true,
    })
  )

  // disabled virtual code, but still keep the full content
  const getDisabledVirtualCode = (snapshot: ts.IScriptSnapshot, languageId: string): VirtualCode => (
    createVirtualCode(snapshot, languageId, {
      completion: false,
      format: false,
      navigation: false,
      semantic: false,
      structure: false,
      verification: false,
    })
  )

  // disabled virtual code, and remove the full content to empty string
  const getFullDisabledVirtualCode = (snapshot: ts.IScriptSnapshot, languageId: string): VirtualCode => (
    createEmptyVirtualCode(snapshot, languageId, {
      completion: false,
      format: false,
      navigation: false,
      semantic: false,
      structure: false,
      verification: false,
    })
  )

  return {
    getLanguageId(uri) {
      const filePath = typeof uri === 'string' ? uri : uri.fsPath
      if (filePath.endsWith('.ets'))
        return 'ets'
      if (filePath.endsWith('.ts'))
        return 'typescript'
      if (filePath.endsWith('.json') || filePath.endsWith('.json5') || filePath.endsWith('.jsonc'))
        return 'json'
      return undefined
    },
    createVirtualCode(uri, languageId, snapshot) {
      const filePath = path.resolve(typeof uri === 'string' ? uri : uri.fsPath)
      const isInExcludePath = excludePaths.some(excludePath => filePath.startsWith(excludePath))
      const isInTsdkPath = filePath.startsWith(tsdk)
      const isDTS = filePath.endsWith('.d.ts')
      const isDETS = filePath.endsWith('.d.ets')

      // json5、json files, directly using full feature virtual code
      if (filePath.endsWith('.json') || filePath.endsWith('.json5') || filePath.endsWith('.jsonc') || languageId === 'json' || languageId === 'jsonc')
        return getFullVitrualCode(snapshot, languageId)

      // ets files, using ts-macro to generate the virtual code
      if (languageId === 'ets') {
        return new ETSVirtualCode(
          filePath,
          tsOrEts.createSourceFile(filePath, snapshot.getText(0, snapshot.getLength()), 99 as any) as ts.SourceFile,
          'typescript',
          [$$thisFixerPlugin()] as any,
        )
      }
      // ETS Server mode
      if (isETSServerMode && !(isDTS || isDETS) && !isInExcludePath)
        return getDisabledVirtualCode(snapshot, languageId)
      // TS Plugin mode
      if (isTSPluginMode && (isDTS || isDETS) && isInExcludePath) {
        return getFullDisabledVirtualCode(snapshot, languageId)
      }
      // Proxy ts internal lib files, such as `lib.d.ts`, `lib.es2020.d.ts`, etc.
      if (isETSServerMode && (isDTS || isDETS) && isInTsdkPath)
        return getDisabledVirtualCode(snapshot, languageId)
    },
    typescript: {
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-expect-error
      extraFileExtensions: isETSServerMode
        ? [
            { extension: 'ets', isMixedContent: false, scriptKind: 8 satisfies ets.ScriptKind.ETS },
            { extension: 'd.ets', isMixedContent: false, scriptKind: 8 satisfies ets.ScriptKind.ETS },
          ]
        : [],
      resolveHiddenExtensions: true,
      getServiceScript(root) {
        return {
          code: root,
          extension: '.ets',
          scriptKind: 3 satisfies typeof ets.ScriptKind.TS,
        }
      },
    },
  }
}
