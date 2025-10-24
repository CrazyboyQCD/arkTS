import type { SysResource } from './sys-resource'

export interface LanguageServerConfigurator {
  getSdkPath(): string
  getSysResource(force?: boolean): SysResource | null
  getSysResourcePath(): string
}
