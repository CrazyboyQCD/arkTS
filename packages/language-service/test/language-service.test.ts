import type { ArkTSExtraLanguageService } from '../src/language-service'
import * as ets from 'ohos-typescript'
import { beforeAll, describe, expect } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import { createArkTSExtraLanguageService } from '../src/language-service'

const files = {
  'get-symbol-tree.ts': {
    text: 'export class Test {}',
  },
  'get-empty-symbol-tree.ts': {
    text: '',
  },
}

describe('language-service', (it) => {
  let service: ArkTSExtraLanguageService
  let languageService: ets.LanguageService

  beforeAll(() => {
    languageService = ets.createLanguageService({
      getCompilationSettings: () => ({}),
      getScriptFileNames: () => [],
      getScriptVersion: () => '',
      getScriptSnapshot: filename => ets.ScriptSnapshot.fromString(files[filename]?.text),
      getDefaultLibFileName: () => '',
      useCaseSensitiveFileNames: () => false,
      fileExists: () => true,
      readFile: path => files[path]?.text,
      getCurrentDirectory: () => '/',
      getDirectories: () => [],
    })
  })

  it.sequential('should create language service', async () => {
    const locale = 'en'
    service = createArkTSExtraLanguageService({ ets, locale })
    expect(service).toBeDefined()
    expect(service.getLocale()).toBe(locale)
  })

  it.sequential('should get $$this positions', () => {
    const documentUri = URI.file('test.ts')
    const documentText = '$$this.test'
    const sourceFile = ets.createSourceFile(documentUri.toString(), documentText, ets.ScriptTarget.Latest)
    const document = TextDocument.create(documentUri.toString(), 'typescript', 0, documentText)
    const positions = service.get$$ThisPositions(sourceFile, document)
    expect(positions).toBeDefined()
    expect(positions.length).toBe(1)
    expect(positions[0].start).toStrictEqual(document.positionAt(0))
    expect(positions[0].end).toStrictEqual(document.positionAt(6))
    expect(positions[0].ast).toBeDefined()
    expect(positions[0].ast.expression.getText(sourceFile)).toBe('$$this')
  })

  describe.sequential('get symbol tree', (it) => {
    it.concurrent('should get empty symbol tree', () => {
      const document = TextDocument.create('get-empty-symbol-tree.ts', 'typescript', 0, files['get-empty-symbol-tree.ts'].text)
      const tree = languageService.getNavigationTree('get-empty-symbol-tree.ts')
      const symbolTree = service.getSymbolTree(tree, document)
      expect(symbolTree).toBeDefined()
      expect(symbolTree?.children?.length).toBe(0)
      expect(symbolTree).toMatchInlineSnapshot(`
        {
          "children": [],
          "detail": "",
          "kind": 13,
          "name": "<global>",
          "range": {
            "end": {
              "character": 0,
              "line": 0,
            },
            "start": {
              "character": 0,
              "line": 0,
            },
          },
          "selectionRange": {
            "end": {
              "character": 0,
              "line": 0,
            },
            "start": {
              "character": 0,
              "line": 0,
            },
          },
        }
      `)
    })

    it.concurrent('should get symbol tree', () => {
      const document = TextDocument.create('get-symbol-tree.ts', 'typescript', 0, files['get-symbol-tree.ts'].text)
      const tree = languageService.getNavigationTree('get-symbol-tree.ts')
      const symbolTree = service.getSymbolTree(tree, document)
      expect(symbolTree).toBeDefined()
      expect(symbolTree?.children?.length).toBe(1)
      expect(symbolTree?.children?.[0]?.name).toBe('Test')
      expect(symbolTree?.children?.[0]?.children?.length).toBe(0)
      expect(symbolTree?.children?.[0]?.detail).toBe('export')
      expect(symbolTree?.children?.[0]?.kind).toBe(5)
      expect(symbolTree?.children?.[0]?.range).toBeDefined()
      expect(symbolTree?.children?.[0]?.selectionRange).toBeDefined()
      expect(symbolTree).toMatchInlineSnapshot(`
        {
          "children": [
            {
              "children": [],
              "detail": "export",
              "kind": 5,
              "name": "Test",
              "range": {
                "end": {
                  "character": 20,
                  "line": 0,
                },
                "start": {
                  "character": 0,
                  "line": 0,
                },
              },
              "selectionRange": {
                "end": {
                  "character": 20,
                  "line": 0,
                },
                "start": {
                  "character": 0,
                  "line": 0,
                },
              },
            },
          ],
          "detail": "",
          "kind": 2,
          "name": "get-symbol-tree",
          "range": {
            "end": {
              "character": 20,
              "line": 0,
            },
            "start": {
              "character": 0,
              "line": 0,
            },
          },
          "selectionRange": {
            "end": {
              "character": 20,
              "line": 0,
            },
            "start": {
              "character": 0,
              "line": 0,
            },
          },
        }
      `)
    })
  })
})
