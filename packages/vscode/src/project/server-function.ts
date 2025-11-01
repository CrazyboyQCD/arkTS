import * as fs from 'node:fs'
import os from 'node:os'
import { ExtensionLogger } from '@arkts/shared/vscode'
import axios, { AxiosError } from 'axios'
import { Autowired, Service } from 'unioc'
import { Translator } from '../translate'
import { ConnectionProtocol } from './interfaces/connection-protocol'

@Service
export class ServerFunctionImpl extends ExtensionLogger implements ConnectionProtocol.ServerFunction {
  @Autowired
  private readonly translator: Translator

  async checkPathExists(path: string): Promise<boolean> {
    return fs.existsSync(path)
  }

  async getHomeDirectory(): Promise<string> {
    return os.homedir()
  }

  async findAllL10nByCurrentLanguage(): Promise<Record<string, string>> {
    return this.translator.findAllByCurrentLanguage()
  }

  async requestTemplateMarketList(request: ConnectionProtocol.ServerFunction.RequestTemplateMarketList.Request): Promise<ConnectionProtocol.ServerFunction.RequestTemplateMarketList.Response> {
    const response = await axios.post('https://svc-drcn.developer.huawei.com/partnerVectorServlet/market/product/list', {
      lang: 'zh_CN',
      pageIndex: request?.pageIndex ?? 1,
      pageSize: request?.pageSize ?? 10,
      categoryIdL1: '4437348dd20f48249540d1b57ef2eff6',
      categoryIdL2: 'categoryL2_202410080002',
      categoryNameL2: '模板',
      ...request,
    })
    if (ConnectionProtocol.ServerFunction.RequestTemplateMarketList.Response.is(response.data)) {
      this.getConsola().info('[ServerFunction.RequestTemplateMarketList] response success:', JSON.stringify(response.data))
      return response.data
    }
    this.getConsola().error('[ServerFunction.RequestTemplateMarketList] Invalid response:', JSON.stringify(response.data))
    throw new AxiosError('[ServerFunction.RequestTemplateMarketList] Invalid response.', 'INVALID_RESPONSE', response.config, response.request, response)
  }

  async requestTemplateMarketDetail(productId: string): Promise<ConnectionProtocol.ServerFunction.RequestTemplateMarketDetail.Response> {
    const response = await axios.post(`https://svc-drcn.developer.huawei.com/partnerVectorServlet/market/buyerQueryProductDetail`, {
      lang: 'zh_CN',
      productId,
    })
    if (ConnectionProtocol.ServerFunction.RequestTemplateMarketDetail.Response.is(response.data)) {
      this.getConsola().info('[ServerFunction.RequestTemplateMarketDetail] response success:', JSON.stringify(response.data))
      return response.data
    }
    this.getConsola().error('[ServerFunction.RequestTemplateMarketDetail] Invalid response:', JSON.stringify(response.data))
    throw new AxiosError('[ServerFunction.RequestTemplateMarketDetail] Invalid response.', 'INVALID_RESPONSE', response.config, response.request, response)
  }
}
