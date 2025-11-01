import type { ConnectionProtocol } from './interfaces/connection-protocol'
import * as fs from 'node:fs'
import os from 'node:os'
import { Autowired, Service } from 'unioc'
import { Translator } from '../translate'

@Service
export class ServerFunctionImpl implements ConnectionProtocol.ServerFunction {
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
}
