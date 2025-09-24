/*
  Auto-generated interfaces from packages/module.schema.json (simplified, strongly-typed)
  Scope: module.json5 (OpenHarmony)
*/

export interface ModuleJson5 {
  module: ModuleConfig
}

export type ModuleType = 'entry' | 'feature' | 'har' | 'shared'

export interface ModuleConfig {
  name: string
  type: ModuleType
  // common
  srcEntrance?: string // deprecated in schema, kept for compatibility
  srcEntry?: string
  abilitySrcEntryDelegator?: string
  abilityStageSrcEntryDelegator?: string
  description?: string
  process?: string // pattern ^[:][0-9a-zA-Z_]+$
  mainElement?: string
  deviceTypes: DeviceType[]
  deviceFeatures?: DeviceFeature[]
  deliveryWithInstall?: boolean // required for entry/feature/shared
  installationFree?: boolean
  virtualMachine?: 'ark' | 'default'
  uiSyntax?: 'ets' | 'hml' // deprecated
  pages?: ProfileRef // "$profile:*"
  systemTheme?: ProfileRef // "$profile:theme_config*"
  metadata?: Metadata[]
  abilities?: Ability[]
  extensionAbilities?: ExtensionAbility[]
  requestPermissions?: RequestPermission[]
  definePermissions?: DefinePermission[]
  testRunner?: TestRunner
  dependencies?: Dependency[]
  libIsolation?: boolean
  compressNativeLibs?: boolean // default false
  extractNativeLibs?: boolean // default true
  atomicService?: AtomicServiceConfig
  targetModuleName?: string // overlay target
  targetPriority?: number // 1-100
  generateBuildHash?: boolean
  isolationMode?: IsolationMode
  proxyData?: ProxyData[]
  fileContextMenu?: ProfileRef
  querySchemes?: string[]
  routerMap?: ProfileRef
  appEnvironments?: AppEnvironment[]
  appStartup?: ProfileRef
  hnpPackages?: HnpPackage[]
}

export type DeviceType = 'default' | 'phone' | 'tablet' | 'tv' | 'wearable' | 'car' | '2in1'
export type DeviceFeature = 'multi_process' | 'free_multi_window' | 'directory_permission'
export type IsolationMode = 'isolationOnly' | 'nonisolationOnly' | 'isolationFirst' | 'nonisolationFirst'

export interface Metadata {
  name?: string
  value?: string
  resource?: ProfileRef | ThemedString
}

export interface TestRunner {
  name: string
  srcPath: string
}

export interface Dependency {
  bundleName?: string // reverse domain, 7-128
  moduleName: string
  versionCode?: number // >=0
}

export interface AtomicServiceConfig {
  preloads?: Array<{ moduleName?: string }>
}

export interface ProxyData {
  uri: string // ^datashareproxy:
  requiredReadPermission?: string
  requiredWritePermission?: string
  metadata?: {
    name?: string
    resource?: ProfileRef | ThemedString
  }
}

export interface AppEnvironment {
  name?: string
  value?: string
}

export interface HnpPackage {
  package: string // *.hnp path
  type: 'public' | 'private'
}

// Ability
export type LaunchType = 'standard' | 'singleton' | 'specified' | 'multiton'
export type BackgroundMode
  = | 'dataTransfer'
    | 'audioPlayback'
    | 'audioRecording'
    | 'location'
    | 'bluetoothInteraction'
    | 'multiDeviceConnection'
    | 'wifiInteraction'
    | 'voip'
    | 'taskKeeping'

export type WindowMode = 'fullscreen' | 'split' | 'floating'

export type Orientation
  = | 'unspecified'
    | 'landscape'
    | 'portrait'
    | 'follow_recent'
    | 'landscape_inverted'
    | 'portrait_inverted'
    | 'auto_rotation'
    | 'auto_rotation_landscape'
    | 'auto_rotation_portrait'
    | 'auto_rotation_restricted'
    | 'auto_rotation_landscape_restricted'
    | 'auto_rotation_portrait_restricted'
    | 'locked'
    | 'auto_rotation_unspecified'
    | 'follow_desktop'
    | ThemedString // resource string as alternative in schema

export interface Ability {
  priority?: number // 0-10
  name: string
  srcEntrance?: string // deprecated
  srcEntry: string
  launchType?: LaunchType // default singleton
  description?: string
  icon?: MediaRef | ThemedString
  label?: StringRef | ThemedString
  permissions?: string[]
  metadata?: Metadata[]
  visible?: boolean // deprecated in favor of exported
  exported?: boolean
  skills?: Skill[]
  backgroundModes?: BackgroundMode[]
  continuable?: boolean
  startWindow?: ProfileRef
  startWindowIcon: MediaRef | ThemedString
  startWindowBackground: ColorRef | ThemedString
  removeMissionAfterTerminate?: boolean
  orientation?: Orientation
  supportWindowMode?: WindowMode[]
  maxWindowRatio?: number
  minWindowRatio?: number
  maxWindowWidth?: number
  minWindowWidth?: number
  maxWindowHeight?: number
  minWindowHeight?: number
  excludeFromMissions?: boolean
  recoverable?: boolean
  unclearableMission?: boolean
  excludeFromDock?: boolean
  isolationProcess?: boolean
  preferMultiWindowOrientation?: 'default' | 'portrait' | 'landscape' | 'landscape_auto'
  continueType?: string[]
  continueBundleName?: string[] // reverse domain
  process?: string // ^[:][0-9a-zA-Z_]+$
}

export interface Skill {
  actions?: string[]
  entities?: string[]
  uris?: SkillUri[]
  permissions?: string[]
  domainVerify?: boolean
}

export type SkillUri
  = | {
    scheme: string
    host?: string
    port?: string
    pathStartWith?: string
    path?: string
    pathRegex?: string
    type?: string
    utd?: string
    maxFileSupported?: number
    linkFeature?: string
  }
  | {
    type?: string
  }

// ExtensionAbility
export type ExtensionType
  = | 'form'
    | 'workScheduler'
    | 'inputMethod'
    | 'service'
    | 'accessibility'
    | 'dataShare'
    | 'fileShare'
    | 'staticSubscriber'
    | 'wallpaper'
    | 'backup'
    | 'window'
    | 'enterpriseAdmin'
    | 'thumbnail'
    | 'preview'
    | 'print'
    | 'share'
    | 'push'
    | 'driver'
    | 'action'
    | 'adsService'
    | 'embeddedUI'
    | 'insightIntentUI'
    | 'autoFill/password'
    | 'hms/account'
    | 'appAccountAuthorization'
    | 'ads'
    | 'remoteNotification'
    | 'remoteLocation'
    | 'statusBarView'
    | 'voip'
    | 'accountLogout'
    | 'sysDialog/userAuth'
    | 'sysDialog/common'
    | 'sysDialog/atomicServicePanel'
    | 'sysDialog/power'
    | 'sysDialog/meetimeCall'
    | 'sysDialog/meetimeContact'
    | 'sysDialog/meetimeMessage'
    | 'sysDialog/print'
    | 'sysPicker/mediaControl'
    | 'sysPicker/share'
    | 'sysPicker/meetimeContact'
    | 'sysPicker/meetimeCallLog'
    | 'sysPicker/photoPicker'
    | 'sysPicker/appSelector'
    | 'sysPicker/navigation'
    | 'sysPicker/photoEditor'
    | 'photoEditor'
    | 'sysPicker/filePicker'
    | 'sysPicker/audioPicker'
    | 'sys/visualExtension'
    | 'sys/commonUI'
    | 'fileAccess'
    | 'autoFill/smart'
    | 'liveViewLockScreen'
    | 'recentPhoto'
    | 'uiService'
    | 'fence'
    | 'callerInfoQuery'
    | 'assetAcceleration'
    | 'awc/webpage'
    | 'awc/newsfeed'
    | 'formEdit'
    | 'liveForm'
    | 'vpn'
    | 'screenTimeGuard'
    | 'appService'

export type ExtensionProcessMode = 'instance' | 'type' | 'bundle' | 'runWithMainProcess'

export interface ExtensionAbilityBase {
  priority?: number
  name: string
  srcEntrance?: string // deprecated
  srcEntry?: string
  icon?: MediaRef | ThemedString
  label?: StringRef | ThemedString
  description?: string
  type: ExtensionType
  permissions?: string[]
  uri?: string
  readPermission?: string
  writePermission?: string
  visible?: boolean // deprecated
  exported?: boolean
  skills?: ExtensionSkill[]
  metadata?: Metadata[]
  dataGroupIds?: string[]
  process?: string // ^[:][0-9a-zA-Z_]+$
}

export interface ExtensionAbilityStatusBarView extends ExtensionAbilityBase {
  type: 'statusBarView'
  extensionProcessMode?: Extract<ExtensionProcessMode, 'instance' | 'type' | 'bundle' | 'runWithMainProcess'>
}

export interface ExtensionAbilityOthers extends ExtensionAbilityBase {
  type: Exclude<ExtensionType, 'statusBarView'>
  extensionProcessMode?: Extract<ExtensionProcessMode, 'instance' | 'type' | 'bundle'>
  appIdentifierAllowList?: string[] // only appears for some branches; optional here
}

export type ExtensionAbility = ExtensionAbilityStatusBarView | ExtensionAbilityOthers

export interface ExtensionSkill {
  actions?: string[]
  entities?: string[]
  uris?: ExtensionSkillUri[]
  permissions?: string[]
}

export type ExtensionSkillUri
  = | {
    scheme: string
    host?: string
    port?: string
    pathStartWith?: string
    path?: string
    pathRegex?: string
    type?: string
    utd?: string
    maxFileSupported?: number
  }
  | {
    type?: string
  }

// Permissions
export interface DefinePermission {
  name: string
  grantMode?: 'system_grant' | 'user_grant'
  availableLevel?: 'system_core' | 'system_basic' | 'normal'
  provisionEnable?: boolean
  distributedSceneEnable?: boolean
  label?: StringRef | ThemedString
  description?: string
}

export interface RequestPermissionUsedScene {
  abilities?: string[]
  when?: 'inuse' | 'always'
}

export interface RequestPermission {
  name: string
  reason?: StringRef | ThemedString
  usedScene?: RequestPermissionUsedScene
}

// Resource-like string aliases used by schema patterns
export type ProfileRef = `^$profile:${string}` // pattern: ^$profile:*
export type MediaRef = `^$media:${string}` // pattern: ^$media:*
export type StringRef = `^$string:${string}` // pattern: ^$string:*
export type ColorRef = `^$color:${string}` // pattern: ^$color:*
export type ThemedString = `{${string}}` // placeholders like {id}
