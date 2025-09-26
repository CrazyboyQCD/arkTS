import type { ResourceDiagnosticLevel } from './services/resource-diagnostic.service'
import process from 'node:process'
import { ETSLanguagePlugin } from '@arkts/language-plugin'
import { createArkTServices, createOpenHarmonyProjectDetector } from '@arkts/language-service'
import { TextDocument } from '@volar/language-server'
import { createConnection, createServer, createTypeScriptProject } from '@volar/language-server/node'
import * as ets from 'ohos-typescript'
import { create as createTypeScriptServices } from 'volar-service-typescript'
import { URI } from 'vscode-uri'
import { LanguageServerConfigManager } from './classes/config-manager'
import { ResourceWatcher } from './classes/resource-watcher'
import { logger } from './logger'
import { createETSResourceCompletionService } from './services/resource-completion.service'

const connection = createConnection()
const server = createServer(connection)
const lspConfiguration = new LanguageServerConfigManager(logger)

logger.getConsola().info(`ETS Language Server is running: (pid: ${process.pid})`)

connection.onRequest('ets/waitForEtsConfigurationChangedRequested', (e) => {
  logger.getConsola().info(`waitForEtsConfigurationChangedRequested: ${JSON.stringify(e)}`)
  lspConfiguration.setConfiguration(e)
})

// 全局配置状态
let globalResourceDiagnosticLevel: ResourceDiagnosticLevel = 'error'

// 监听配置变更
connection.onDidChangeConfiguration((params) => {
  const settings = params.settings
  if (settings?.ets?.resourceReferenceDiagnostic) {
    globalResourceDiagnosticLevel = settings.ets.resourceReferenceDiagnostic as ResourceDiagnosticLevel
    logger.getConsola().info('Resource diagnostic level changed to:', globalResourceDiagnosticLevel)
  }
})

// TODO: 监听文件变更
// connection.onDidChangeWatchedFiles((params) => {
//   logger.getConsola().info('Watched files changed:', JSON.stringify(params))
// })

ResourceWatcher.from(connection)

connection.onInitialize(async (params) => {
  if (params.locale)
    lspConfiguration.setLocale(params.locale)
  lspConfiguration.setConfiguration({ typescript: params.initializationOptions?.typescript })

  // 初始化配置
  if (params.initializationOptions?.ets?.resourceReferenceDiagnostic) {
    globalResourceDiagnosticLevel = params.initializationOptions.ets.resourceReferenceDiagnostic as ResourceDiagnosticLevel
    logger.getConsola().info('Initial resource diagnostic level:', globalResourceDiagnosticLevel)
  }

  const tsdk = lspConfiguration.getTypeScriptTsdk()

  // 获取项目根目录和 SDK 路径
  const projectRoot = params.workspaceFolders?.[0]?.uri
    ? URI.parse(params.workspaceFolders[0].uri).fsPath
    : process.cwd()
  const sdkPath = lspConfiguration.getSdkPath()
  logger.getConsola().info('Server initialization - Project root:', projectRoot)
  logger.getConsola().info('Server initialization - SDK path:', sdkPath)
  logger.getConsola().info('Server initialization - Workspace folders:', params.workspaceFolders)
  const workspaceDetector = createOpenHarmonyProjectDetector(URI.file(projectRoot))
  const arktsServices = await createArkTServices({ ets, locale: params.locale ?? '' }, workspaceDetector)
  const typescriptServices = createTypeScriptServices(ets as unknown as typeof import('typescript'))
  const etsLanguagePlugin = ETSLanguagePlugin(ets, {
    excludePaths: [lspConfiguration.getSdkPath(), lspConfiguration.getHmsSdkPath()].filter(Boolean) as string[],
    tsdk: lspConfiguration.getTsdkPath(),
  })

  connection.onDidChangeWatchedFiles((params) => {
    for (const change of params.changes)
      workspaceDetector.updateFile(URI.file(change.uri))
  })

  connection.onDidChangeTextDocument((params) => {
    for (const change of params.contentChanges) {
      workspaceDetector.updateTextDocument(
        TextDocument.create(
          params.textDocument.uri,
          etsLanguagePlugin.getLanguageId(params.textDocument.uri) ?? '',
          params.textDocument.version,
          change.text,
        ),
      )
    }
  })

  return server.initialize(
    params,
    createTypeScriptProject(ets as any, tsdk.diagnosticMessages, () => {
      return {
        languagePlugins: [
          ETSLanguagePlugin(ets, {
            excludePaths: [lspConfiguration.getSdkPath(), lspConfiguration.getHmsSdkPath()].filter(Boolean) as string[],
            tsdk: lspConfiguration.getTsdkPath(),
          }),
        ],
        setup(options) {
          if (!options.project || !options.project.typescript || !options.project.typescript.languageServiceHost)
            return

          const originalSettings = options.project.typescript.languageServiceHost.getCompilationSettings() || {}
          logger.getConsola().debug(`Settings: ${JSON.stringify(lspConfiguration.getTsConfig(originalSettings as ets.CompilerOptions), null, 2)}`)
          options.project.typescript.languageServiceHost.getCompilationSettings = () => {
            return lspConfiguration.getTsConfig(originalSettings as ets.CompilerOptions) as any
          }
        },
      }
    }),
    [
      ...typescriptServices,
      ...arktsServices,
      createETSResourceCompletionService(projectRoot, lspConfiguration),
    ],
  )
})

connection.listen()
connection.onInitialized(server.initialized)
connection.onShutdown(server.shutdown)

// 调试日志：LSP 服务已启动
logger.getConsola().info('ETS Language Server fully initialized with resource definition support')
