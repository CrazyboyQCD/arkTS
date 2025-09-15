import { describe, expect, it } from 'vitest'
import { createIntegratedResourceDefinitionService } from '../src/services/resource-definition.service'

describe('集成资源定义服务 - 能力声明', () => {
  it('应具有正确的 name 与 definitionProvider 能力', () => {
    const service = createIntegratedResourceDefinitionService('/tmp/project', () => '/tmp/sdk')
    expect(service.name).toBe('arkts-resource-definition-integrated')
    expect(service.capabilities?.definitionProvider).toBe(true)
    expect(typeof service.create).toBe('function')
  })
})
