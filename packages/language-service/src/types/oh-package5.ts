/**
 * JSON schema for module-level oh-package.json5 files
 */
export interface OhPackageJson5 {
  /**
   * Specifies the name of a third-party database.
   * Format: @group/packagename
   * Must be globally unique, only lowercase letters, digits, `_`, `-`
   */
  name: string

  /**
   * Third-party library version. Must comply with semver.
   */
  version: string

  /**
   * Compatible SDK version.
   */
  compatibleSdkVersion?: string | number

  /**
   * Compatible SDK type.
   */
  compatibleSdkType?: string

  /**
   * Obfuscation enabling flag.
   */
  obfuscated?: boolean

  /**
   * SDK compatibility configuration of the native components.
   */
  nativeComponents?: {
    /**
     * Specifies the name of a native component.
     */
    name: string

    /**
     * Native component version. Must comply with semver.
     */
    version: string

    /**
     * Compatible SDK version.
     */
    compatibleSdkVersion?: string

    /**
     * Compatible SDK type.
     */
    compatibleSdkType?: string
  }[]

  /**
   * Describes the third-party database information (helpful for search and discovery).
   */
  description?: string

  /**
   * Keyword information array, max 10 items, each ≤ 20 characters.
   */
  keywords?: string[]

  /**
   * Author of the package.
   */
  author?: Person

  /**
   * The url to the home page of the third-party library (e.g., GitHub/Gitee).
   */
  homepage?: string

  /**
   * Open-source code repository address.
   */
  repository?: string

  /**
   * The open source license (MIT, BSD, Apache-2.0, etc.).
   */
  license?: string

  /**
   * Runtime dependencies.
   */
  dependencies?: Dependency

  /**
   * Development dependencies.
   */
  devDependencies?: Dependency

  /**
   * Dynamic dependencies.
   */
  dynamicDependencies?: Dependency

  /**
   * Package type. For a shared library, the value is 'InterfaceHar'.
   */
  packageType?: string

  /**
   * Identifies the category of the package.
   */
  category?: string

  /**
   * Module ID that is the primary entry point.
   */
  main?: string

  /**
   * Type definition file (e.g., .d.ts or .d.ets).
   */
  types?: string

  /**
   * Harmony package artifact type.
   * - original: source code
   * - obfuscation: obfuscated code
   * - bytecode: compiled abc ark bytecode
   */
  artifactType?: 'original' | 'obfuscation' | 'bytecode'

  /**
   * Lifecycle hooks.
   */
  hooks?: {
    preInstall?: string
    postInstall?: string
    preUninstall?: string
    postUninstall?: string
    prePublish?: string
    postPublish?: string
    preVersion?: string
    postVersion?: string
  }

  /**
   * Script commands.
   */
  scripts?: Record<string, string>
}

/**
 * A person who has been involved in creating or maintaining this package.
 */
export type Person
  = | string
    | {
      name?: string
      email?: string
    }

/**
 * Dependencies are specified as a map of package name -> version range.
 */
export type Dependency = Record<string, string>
