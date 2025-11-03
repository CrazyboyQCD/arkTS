import { describe, expect, it } from 'vitest'
import { ConnectionProtocol } from '../src/project/interfaces/connection-protocol'
import projectMock from './project-mock.json'

describe('connectionProtocol', () => {
  it('should be valid', () => {
    expect(ConnectionProtocol.ServerFunction.RequestTemplateMarketList.Response.is(projectMock)).toBe(true)
  })
})
