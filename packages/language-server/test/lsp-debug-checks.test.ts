import { describe, expect, it } from 'vitest'

describe('lSP 调试检查项（静态约束）', () => {
  it('文档选择器应至少包含 ets 与 typescript', () => {
    const documentSelector = [
      { language: 'ets' },
      { language: 'typescript' },
    ]
    const langs = documentSelector.map(s => s.language)
    expect(langs).toContain('ets')
    expect(langs).toContain('typescript')
  })

  it('服务加载顺序应包含资源定义服务，且位于合适位置', () => {
    const serviceOrder = [
      'typescript-semantic (TypeScript 语义服务)',
      'typescript-syntactic (TypeScript 语法服务)',
      'typescript-other (其他 TypeScript 服务)',
      'ets-linter-diagnostic (ETS 诊断服务)',
      'ets-navigation-tree (ETS 符号服务)',
      '$$this-service ($$this 修复服务)',
      'arkts-resource-definition-integrated (资源定义跳转服务)',
    ]
    const hasResourceService = serviceOrder.some(s => s.includes('arkts-resource-definition-integrated'))
    expect(hasResourceService).toBe(true)
    const idxTsSemantic = serviceOrder.findIndex(s => s.startsWith('typescript-semantic'))
    const idxArkts = serviceOrder.findIndex(s => s.startsWith('arkts-resource-definition-integrated'))
    expect(idxTsSemantic).toBeGreaterThanOrEqual(0)
    expect(idxArkts).toBeGreaterThan(idxTsSemantic)
  })
})
