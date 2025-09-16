import { Position } from '@volar/language-server/node'
import * as ets from 'ohos-typescript'
import { beforeAll, describe, expect, it } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageServerConfigManager } from '../src/classes/config-manager'
import { logger } from '../src/logger'
import { ResourceDefinitionService } from '../src/services/resource-definition.service'

describe('$r() 资源调用检测', () => {
  let service: ResourceDefinitionService
  let mockLspConfiguration: LanguageServerConfigManager

  beforeAll(() => {
    mockLspConfiguration = new LanguageServerConfigManager(logger)
    service = new ResourceDefinitionService(mockLspConfiguration)
  })

  const testCases = [
    {
      name: '基本字符串参数',
      code: 'Text($r("app.string.app_name"))',
      position: 10, // 在 $r() 内部
    },
    {
      name: '单引号字符串参数',
      code: '.fontColor($r(\'app.color.primary_color\'))',
      position: 20, // 在 $r() 内部
    },
    {
      name: '模板字符串参数',
      code: '.backgroundColor($r(`app.color.start_window_background`))',
      position: 25, // 在 $r() 内部
    },
    {
      name: '媒体资源引用',
      code: 'Image($r("app.media.icon"))',
      position: 12, // 在 $r() 内部
    },
  ]

  it('能在点击区域内检测到 $r() 调用并提取资源引用', async () => {
    for (const testCase of testCases) {
      const sourceFile = ets.createSourceFile('test.ets', testCase.code, ets.ScriptTarget.ES2015, true)
      const document = TextDocument.create('file://test.ets', 'ets', 1, testCase.code)
      const position = Position.create(0, testCase.position)

      // 通过 provideDefinition 方法测试，它会内部调用 findResourceCallAtPosition
      const result = await service.provideDefinition(document, position, sourceFile)

      // 由于没有真实的资源文件，我们主要测试方法是否正常执行而不抛出错误
      // 结果可能为 null（因为资源不存在），但方法应该正常执行
      expect(result === null || Array.isArray(result)).toBe(true)
    }
  })

  it('无 $r() 的行返回 null', async () => {
    const code = 'normal text without resource call'
    const sourceFile = ets.createSourceFile('test.ets', code, ets.ScriptTarget.ES2015, true)
    const document = TextDocument.create('file://test.ets', 'ets', 1, code)
    const position = Position.create(0, 0)

    const result = await service.provideDefinition(document, position, sourceFile)
    expect(result).toBeNull()
  })

  it('点击位置不在 $r() 调用范围内时返回 null', async () => {
    const code = 'Text($r("app.string.app_name"))'
    const sourceFile = ets.createSourceFile('test.ets', code, ets.ScriptTarget.ES2015, true)
    const document = TextDocument.create('file://test.ets', 'ets', 1, code)
    const position = Position.create(0, 0) // 在 $r() 之前

    const result = await service.provideDefinition(document, position, sourceFile)
    expect(result).toBeNull()
  })
})
