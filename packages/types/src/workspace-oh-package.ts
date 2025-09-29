/**
 * Project-level oh-package.json5 file interface
 */
export interface WorkspaceLevelOhPackage5 {
  /** Identifies the development version. */
  modelVersion: string

  /**
   * Describes the third-party database information, which is helpful for search and discovery.
   * @maxLength 512
   * @minLength 0
   */
  description?: string

  /** Dependencies */
  dependencies?: WorkspaceLevelOhPackage5.Dependency

  /** Development dependencies */
  devDependencies?: WorkspaceLevelOhPackage5.Dependency

  /** Dynamic dependencies */
  dynamicDependencies?: WorkspaceLevelOhPackage5.Dependency

  /** Overrides */
  overrides?: WorkspaceLevelOhPackage5.Overrides

  /** Override dependency map */
  overrideDependencyMap?: WorkspaceLevelOhPackage5.OverrideDependencyMap

  /** Specify the package version parameter file. */
  parameterFile?: string

  /** Lifecycle hooks */
  hooks?: WorkspaceLevelOhPackage5.Hooks

  /** Script commands */
  scripts?: WorkspaceLevelOhPackage5.Scripts
}

export namespace WorkspaceLevelOhPackage5 {
  export function is(value: unknown): value is WorkspaceLevelOhPackage5 {
    return typeof value === 'object'
      && value !== null
      && 'modelVersion' in value
      && typeof value.modelVersion === 'string'
  }
}

export namespace WorkspaceLevelOhPackage5 {
  /**
   * Dependencies are specified with a simple hash of package name to version range.
   * The version range is a string which has one or more space-separated descriptors.
   * Dependencies can also be identified with a tarball or a module directory in the same project.
   */
  export interface Dependency {
    [packageName: string]: string
  }

  /**
   * Overrides provide a way to replace a package in your dependency graph with another version.
   */
  export interface Overrides {
    [packageName: string]: string
  }

  /**
   * Replace all direct dependencies of selected packages using external configuration files.
   */
  export interface OverrideDependencyMap {
    [packageName: string]: string
  }

  /**
   * The 'hooks' member is an object hash of script commands that are run at various times
   * in the lifecycle of your package. The key is the lifecycle event, and the value is
   * the command to run at that point.
   */
  export interface Hooks {
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
   * The 'scripts' member is an json5 object of script commands, it's command format is 'key': 'value'.
   * The key is the alias of script, and this value is the command to run.
   */
  export interface Scripts {
    [scriptName: string]: string
  }
}
