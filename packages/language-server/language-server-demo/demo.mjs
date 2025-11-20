import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const jsType = process.argv[2] === 'esm' ? 'mjs' : 'js';

// 配置
const config = {
  // 语言服务器路径（相对于项目根目录）
  serverPath: path.resolve(__dirname, `../bin/ets-language-server.${jsType}`),
  // 工作区路径
  workspaceRoot: path.join(__dirname, 'test-workspace'),
  // TypeScript SDK 路径（使用 node_modules 中的 TypeScript）
  tsdk: path.resolve(__dirname, '../../../node_modules/ohos-typescript/lib'),
  // ohos-typescript 路径
  ohosTypescriptPath: path.resolve(__dirname, '../../../ohos-typescript'),
  // OpenHarmony SDK 路径（可选）
  sdkPath: process.env.OHOS_SDK_PATH || undefined,
}

// ANSI 颜色代码
const colors = {
  reset: '\x1B[0m',
  bright: '\x1B[1m',
  dim: '\x1B[2m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  magenta: '\x1B[35m',
  cyan: '\x1B[36m',
}

// 日志工具
const logger = {
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: msg => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: msg => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  data: (label, data) => console.log(`${colors.dim}  ${label}:${colors.reset}`, JSON.stringify(data, null, 2)),
}

// JSON-RPC 消息处理器
class JsonRpcClient {
  constructor(process) {
    this.process = process
    this.messageId = 0
    this.pendingRequests = new Map()
    this.buffer = ''

    // 设置数据处理器
    this.process.on('message', data => this.handleMessage(data))
    this.process.stderr.on('data', (data) => {
      const message = data.toString()
      if (message.trim()) {
        logger.info(`[服务器输出] ${message.trim()}`)
      }
    })
  }

  handleData(data) {
    this.buffer += data.toString()

    while (true) {
      // 查找 Content-Length 头
      const lengthMatch = this.buffer.match(/Content-Length: (\d+)\r\n/)
      if (!lengthMatch) break

      const contentLength = Number.parseInt(lengthMatch[1])
      const headerEnd = this.buffer.indexOf('\r\n\r\n')

      if (headerEnd === -1) break

      const messageStart = headerEnd + 4
      const messageEnd = messageStart + contentLength

      if (this.buffer.length < messageEnd) break

      // 提取消息
      const messageJson = this.buffer.substring(messageStart, messageEnd)
      this.buffer = this.buffer.substring(messageEnd)

      try {
        const message = JSON.parse(messageJson)
        this.handleMessage(message)
      }
      catch (error) {
        logger.error(`解析消息失败: ${error.message}, ${messageJson}`)
      }
    }
  }

  handleMessage(message) {
    if (message.id && this.pendingRequests.has(message.id)) {
      // 处理响应
      const { resolve, reject, method } = this.pendingRequests.get(message.id)
      this.pendingRequests.delete(message.id)

      if (message.error) {
        logger.error(`请求 ${method} 失败:`)
        logger.data('错误', message.error)
        reject(new Error(message.error.message))
      }
      else {
        logger.success(`收到 ${method} 响应`)
        if (message.result && Object.keys(message.result).length > 0) {
          logger.data('结果', message.result)
        }
        resolve(message.result)
      }
    }
    else if (message.method) {
      // 处理通知或请求
      logger.info(`收到通知/请求: ${message.method}`)
      if (message.params) {
        logger.data('参数', message.params)
      }
    }
  }

  sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      // 检查进程是否仍然连接
      if (!this.process.connected) {
        return reject(new Error('IPC channel is closed'))
      }

      const id = ++this.messageId
      const message = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      }

      this.pendingRequests.set(id, { resolve, reject, method })

      logger.info(`发送请求: ${method}`)
      logger.data('参数', params)

      // 检查发送是否成功
      const success = this.process.send(message)
      if (!success) {
        this.pendingRequests.delete(id)
        return reject(new Error('Failed to send message through IPC'))
      }
    })
  }

  sendNotification(method, params) {
    // 检查进程是否仍然连接
    if (!this.process.connected) {
      throw new Error('IPC channel is closed')
    }

    const message = {
      jsonrpc: '2.0',
      method,
      params,
    }

    logger.info(`发送通知: ${method}`)
    logger.data('参数', params)

    // 检查发送是否成功
    const success = this.process.send(message)
    if (!success) {
      throw new Error('Failed to send message through IPC')
    }
  }
}

// 演示协议流程（不需要实际服务器）
async function demonstrateProtocol() {
  logger.section('📚 LSP 协议通信演示')

  // 初始化工作区
  const workspaceRoot = config.workspaceRoot

  logger.section('📋 1. Initialize 请求')
  logger.info('客户端发送 initialize 请求，包含客户端能力和工作区信息')

  const initializeRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      processId: process.pid,
      clientInfo: {
        name: 'arkts-demo-client',
        version: '1.0.0',
      },
      rootUri: `file://${workspaceRoot}`,
      workspaceFolders: [
        {
          uri: `file://${workspaceRoot}`,
          name: 'test-workspace',
        },
      ],
      capabilities: {
        textDocument: {
          completion: { dynamicRegistration: true },
          hover: { dynamicRegistration: true },
          definition: { dynamicRegistration: true },
        },
      },
      initializationOptions: {
        typescript: { tsdk: config.tsdk },
      },
    },
  }

  logger.data('请求消息', initializeRequest)

  logger.info('\n服务器响应包含服务器能力信息:')
  const initializeResponse = {
    jsonrpc: '2.0',
    id: 1,
    result: {
      capabilities: {
        textDocumentSync: 2,
        completionProvider: { triggerCharacters: ['.', '"', '\'', '/', '@', '<'] },
        hoverProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        codeActionProvider: true,
        documentFormattingProvider: true,
      },
      serverInfo: {
        name: 'ets-language-server',
        version: '1.2.2',
      },
    },
  }

  logger.data('响应消息', initializeResponse)

  logger.section('📋 2. ArkTS 配置请求')
  logger.info('发送 ets/waitForEtsConfigurationChangedRequested 请求')
  logger.info('这是 ArkTS Language Server 的特殊请求，用于配置 SDK 路径等信息')

  const configRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'ets/waitForEtsConfigurationChangedRequested',
    params: {
      typescript: { tsdk: config.tsdk },
      ohos: {
        lib: [],
        typeRoots: [],
        baseUrl: workspaceRoot,
        paths: {},
      },
      debug: true,
    },
  }

  logger.data('配置请求', configRequest)

  logger.section('📋 3. Initialized 通知')
  logger.info('客户端通知服务器初始化完成')

  const initializedNotification = {
    jsonrpc: '2.0',
    method: 'initialized',
    params: {},
  }

  logger.data('通知消息', initializedNotification)

  logger.section('📋 4. textDocument/didOpen 通知')
  logger.info('客户端通知服务器打开了一个文档')

  const sampleFile = path.join(workspaceRoot, 'sample.ets')
  const fileContent = fs.readFileSync(sampleFile, 'utf8')

  const didOpenNotification = {
    jsonrpc: '2.0',
    method: 'textDocument/didOpen',
    params: {
      textDocument: {
        uri: `file://${sampleFile}`,
        languageId: 'ets',
        version: 1,
        text: fileContent,
      },
    },
  }

  logger.data('通知消息', didOpenNotification)

  logger.section('📋 5. textDocument/hover 请求')
  logger.info('客户端请求某个位置的悬停信息')

  const hoverRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'textDocument/hover',
    params: {
      textDocument: { uri: `file://${sampleFile}` },
      position: { line: 2, character: 10 },
    },
  }

  logger.data('请求消息', hoverRequest)

  logger.info('\n服务器响应包含类型信息和文档:')
  const hoverResponse = {
    jsonrpc: '2.0',
    id: 3,
    result: {
      contents: {
        kind: 'markdown',
        value: '```typescript\n(property) message: string\n```',
      },
      range: {
        start: { line: 2, character: 8 },
        end: { line: 2, character: 15 },
      },
    },
  }

  logger.data('响应消息', hoverResponse)

  logger.section('📋 6. textDocument/completion 请求')
  logger.info('客户端请求代码补全')

  const completionRequest = {
    jsonrpc: '2.0',
    id: 4,
    method: 'textDocument/completion',
    params: {
      textDocument: { uri: `file://${sampleFile}` },
      position: { line: 5, character: 10 },
    },
  }

  logger.data('请求消息', completionRequest)

  logger.info('\n服务器响应包含补全项列表:')
  const completionResponse = {
    jsonrpc: '2.0',
    id: 4,
    result: {
      isIncomplete: false,
      items: [
        { label: 'Column', kind: 7, detail: 'Component' },
        { label: 'Row', kind: 7, detail: 'Component' },
        { label: 'Text', kind: 7, detail: 'Component' },
        { label: 'build', kind: 2, detail: 'method' },
        { label: 'message', kind: 5, detail: 'property' },
      ],
    },
  }

  logger.data('响应消息', completionResponse)

  logger.section('📋 7. textDocument/didClose 通知')
  logger.info('客户端通知服务器关闭了文档')

  const didCloseNotification = {
    jsonrpc: '2.0',
    method: 'textDocument/didClose',
    params: {
      textDocument: { uri: `file://${sampleFile}` },
    },
  }

  logger.data('通知消息', didCloseNotification)

  logger.section('📋 8. shutdown 请求')
  logger.info('客户端请求关闭服务器')

  const shutdownRequest = {
    jsonrpc: '2.0',
    id: 5,
    method: 'shutdown',
    params: null,
  }

  logger.data('请求消息', shutdownRequest)

  const shutdownResponse = {
    jsonrpc: '2.0',
    id: 5,
    result: null,
  }

  logger.data('响应消息', shutdownResponse)

  logger.section('📋 9. exit 通知')
  logger.info('客户端通知服务器退出')

  const exitNotification = {
    jsonrpc: '2.0',
    method: 'exit',
    params: null,
  }

  logger.data('通知消息', exitNotification)

  logger.section('✨ 协议演示完成！')
  logger.success('以上演示了 LSP 协议的基本通信流程')
  logger.info('\n要测试真实的语言服务器，请:')
  logger.info('1. 初始化 ohos-typescript 子模块')
  logger.info('2. 构建语言服务器: pnpm -F "@arkts/language-server" build')
  logger.info('3. 重新运行此 Demo')
  logger.info('\n有关 LSP 协议的更多信息，请访问:')
  logger.info('https://microsoft.github.io/language-server-protocol/')
}

// 主函数
async function main() {
  logger.section('🚀 ArkTS Language Server Demo')

  // 检查语言服务器是否存在
  const serverExists = fs.existsSync(config.serverPath)

  // 检查 ohos-typescript 是否初始化
  const ohosTypescriptExists = fs.existsSync(config.ohosTypescriptPath)
    && fs.readdirSync(config.ohosTypescriptPath).length > 0

  if (!serverExists || !ohosTypescriptExists) {
    if (!serverExists) {
      logger.warn(`语言服务器未找到: ${config.serverPath}`)
      logger.info('请先构建语言服务器:')
      logger.info('  cd /path/to/arkTS')
      logger.info('  pnpm -F "@arkts/language-server" build')
      logger.info('')
    }

    if (!ohosTypescriptExists) {
      logger.warn(`ohos-typescript 未初始化: ${config.ohosTypescriptPath}`)
      logger.info('需要初始化 ohos-typescript 子模块:')
      logger.info('  git submodule update --init --recursive')
      logger.info('')
      logger.info('如果子模块初始化失败（gitcode.com 访问受限），可以尝试:')
      logger.info('  1. 手动下载 OpenHarmony TypeScript 编译器')
      logger.info('  2. 将其放置在 ohos-typescript 目录下')
      logger.info('  3. 或者使用标准 TypeScript（功能有限）')
      logger.info('')
    }

    logger.warn('此 Demo 将只演示协议通信流程，不启动实际的语言服务器')
    logger.info('')
    await demonstrateProtocol()
    return
  }

  logger.success(`语言服务器路径: ${config.serverPath}`)

  // 工作区
  const workspaceRoot = config.workspaceRoot

  // 启动语言服务器
  logger.section('🔌 启动语言服务器')

  const serverProcess = spawn('node', [config.serverPath, '--node-ipc', '--server-mode'], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    env: { ...process.env },
  })

  const client = new JsonRpcClient(serverProcess)

  // 监听服务器进程的错误和退出事件
  serverProcess.on('error', (error) => {
    logger.error(`语言服务器进程错误: ${error.message}`)
  })

  serverProcess.on('exit', (code, signal) => {
    logger.info(`语言服务器进程退出，退出码: ${code}, 信号: ${signal}`)
  })

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000))
  logger.success('语言服务器已启动')

  try {
    // 1. 发送 initialize 请求
    logger.section('📡 发送 Initialize 请求')

    const initResult = await client.sendRequest('initialize', {
      processId: process.pid,
      clientInfo: {
        name: 'arkts-demo-client',
        version: '1.0.0',
      },
      rootUri: `file://${workspaceRoot}`,
      workspaceFolders: [
        {
          uri: `file://${workspaceRoot}`,
          name: 'test-workspace',
        },
      ],
      capabilities: {
        textDocument: {
          synchronization: {
            dynamicRegistration: true,
            willSave: true,
            willSaveWaitUntil: true,
            didSave: true,
          },
          completion: {
            dynamicRegistration: true,
            completionItem: {
              snippetSupport: true,
            },
          },
          hover: {
            dynamicRegistration: true,
            contentFormat: ['markdown', 'plaintext'],
          },
          signatureHelp: {
            dynamicRegistration: true,
          },
          definition: {
            dynamicRegistration: true,
          },
          references: {
            dynamicRegistration: true,
          },
          documentHighlight: {
            dynamicRegistration: true,
          },
          documentSymbol: {
            dynamicRegistration: true,
          },
          codeAction: {
            dynamicRegistration: true,
          },
          codeLens: {
            dynamicRegistration: true,
          },
          formatting: {
            dynamicRegistration: true,
          },
          rangeFormatting: {
            dynamicRegistration: true,
          },
          onTypeFormatting: {
            dynamicRegistration: true,
          },
          rename: {
            dynamicRegistration: true,
          },
          publishDiagnostics: {
            relatedInformation: true,
          },
        },
        workspace: {
          applyEdit: true,
          workspaceEdit: {
            documentChanges: true,
          },
          didChangeConfiguration: {
            dynamicRegistration: true,
          },
          didChangeWatchedFiles: {
            dynamicRegistration: true,
          },
          symbol: {
            dynamicRegistration: true,
          },
          executeCommand: {
            dynamicRegistration: true,
          },
        },
      },
      initializationOptions: {
        typescript: {
          tsdk: config.tsdk,
        },
      },
    })

    logger.success('Initialize 请求成功')
    logger.data('服务器能力', initResult.capabilities)

    // 2. 发送配置请求（ArkTS 特定）
    logger.section('⚙️  发送配置请求')

    // 构建基本配置（如果没有 SDK 路径，使用最小配置）
    const etsConfig = {
      typescript: {
        tsdk: config.tsdk,
      },
      ohos: config.sdkPath ? {
        sdkPath: config.sdkPath,
        lib: [],
        typeRoots: [],
        baseUrl: workspaceRoot,
        paths: {},
      } : {
        // 最小配置，不依赖 SDK
        lib: [],
        typeRoots: [],
        baseUrl: workspaceRoot,
        paths: {},
      },
      debug: true,
    }

    if (!config.sdkPath) {
      logger.warn('未配置 OpenHarmony SDK 路径，使用最小配置')
      logger.info('可通过设置环境变量 OHOS_SDK_PATH 来配置 SDK 路径')
    }

    await client.sendRequest('ets/waitForEtsConfigurationChangedRequested', etsConfig)
    logger.success('配置请求已发送')

    // 3. 发送 initialized 通知
    logger.section('✅ 发送 Initialized 通知')

    client.sendNotification('initialized', {})
    logger.success('Initialized 通知已发送')

    // 等待一下让服务器处理
    await new Promise(resolve => setTimeout(resolve, 500))

    // 4. 打开文档
    logger.section('📄 打开文档')

    const sampleFile = path.join(workspaceRoot, 'sample.ets')
    const fileContent = fs.readFileSync(sampleFile, 'utf8')

    client.sendNotification('textDocument/didOpen', {
      textDocument: {
        uri: `file://${sampleFile}`,
        languageId: 'ets',
        version: 1,
        text: fileContent,
      },
    })

    logger.success(`已打开文档: sample.ets`)

    // 等待一下让服务器分析文档
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 5. 测试悬停信息
    logger.section('🔍 测试悬停信息')

    try {
      const hoverResult = await client.sendRequest('textDocument/hover', {
        textDocument: {
          uri: `file://${sampleFile}`,
        },
        position: {
          line: 2,
          character: 10,
        },
      })

      if (hoverResult) {
        logger.success('成功获取悬停信息')
        logger.data('悬停内容', hoverResult)
      }
      else {
        logger.info('该位置没有悬停信息')
      }
    }
    catch (error) {
      logger.warn(`悬停请求失败: ${error.message}`)
    }

    // 6. 测试代码补全
    logger.section('💡 测试代码补全')

    try {
      const completionResult = await client.sendRequest('textDocument/completion', {
        textDocument: {
          uri: `file://${sampleFile}`,
        },
        position: {
          line: 5,
          character: 10,
        },
      })

      if (completionResult && (completionResult.items || completionResult.length > 0)) {
        const items = completionResult.items || completionResult
        logger.success(`获取到 ${items.length} 个补全项`)

        // 显示前 5 个补全项
        const previewItems = items.slice(0, 5)
        previewItems.forEach((item, index) => {
          logger.info(`  ${index + 1}. ${item.label} (${item.kind || 'unknown'})`)
        })

        if (items.length > 5) {
          logger.info(`  ... 还有 ${items.length - 5} 个补全项`)
        }
      }
      else {
        logger.info('该位置没有补全项')
      }
    }
    catch (error) {
      logger.warn(`补全请求失败: ${error.message}`)
    }

    // 7. 关闭文档
    logger.section('📤 关闭文档')

    client.sendNotification('textDocument/didClose', {
      textDocument: {
        uri: `file://${sampleFile}`,
      },
    })

    logger.success('文档已关闭')

    // 8. 关闭语言服务器
    logger.section('🛑 关闭语言服务器')

    await client.sendRequest('shutdown', null)
    logger.success('Shutdown 请求已发送')

    client.sendNotification('exit', null)
    logger.success('Exit 通知已发送')

    // 等待服务器退出
    await new Promise(resolve => setTimeout(resolve, 1000))

    logger.section('✨ Demo 执行完成！')
    logger.success('语言服务器通信测试成功')
    logger.info('\n如果你看到这条消息，说明语言服务器的基本功能正常工作。')
  }
  catch (error) {
    logger.error(`执行过程中出错: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
  finally {
    // 确保进程被终止
    serverProcess.kill()
    process.exit(0)
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  logger.error(`未捕获的异常: ${error.message}`)
  console.error(error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, _promise) => {
  logger.error(`未处理的 Promise 拒绝: ${reason}`)
  console.error(reason)
  process.exit(1)
})

// 运行主函数
main()
