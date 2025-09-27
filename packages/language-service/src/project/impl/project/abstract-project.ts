import type { URI } from 'vscode-uri'
import type { BuildProfile, DeepPartial, OhPackageJson5 } from '../../../types'
import type { OpenHarmonyProject } from '../../project'
import type { OpenHarmonyProjectDetector } from '../../project-detector'
import json5 from 'json5'
import { Utils } from 'vscode-uri'

export abstract class OpenHarmonyProjectImpl implements OpenHarmonyProject {
  constructor(
    private readonly projectRoot: URI,
    private readonly projectDetector: OpenHarmonyProjectDetector,
  ) {}

  getProjectDetector(): OpenHarmonyProjectDetector {
    return this.projectDetector
  }

  async is(): Promise<boolean> {
    return await this.readOhPackageJson5() !== null
  }

  static readonly defaultResetTypes: readonly OpenHarmonyProject.ResetType[] = [
    'build-profile.json5',
    'oh-package.json5',
  ]

  getProjectRoot(): URI {
    return this.projectRoot
  }

  private _ohPackageJson5: DeepPartial<OhPackageJson5> | null = null

  async readOhPackageJson5(): Promise<DeepPartial<OhPackageJson5> | null> {
    if (this._ohPackageJson5 !== null)
      return this._ohPackageJson5
    const ohPackageJson5Path = Utils.joinPath(this.getProjectRoot(), 'oh-package.json5')
    const fs = await this.getProjectDetector().getFileSystem()

    try {
      if (!(await fs.exists(ohPackageJson5Path.fsPath)) || !(await fs.stat(ohPackageJson5Path.fsPath)).isFile())
        return null
      this.getProjectDetector()
        .getLogger('ProjectDetector/Project/readOhPackageJson5')
        .getConsola()
        .info(`Read oh-package.json5: ${ohPackageJson5Path.toString()}`)
      const ohPackageJson5 = await fs.readFile(ohPackageJson5Path.fsPath, 'utf-8')
      const ohPackage = json5.parse(ohPackageJson5)
      this._ohPackageJson5 = ohPackage
      return ohPackage
    }
    catch (error) {
      this.getProjectDetector()
        .getLogger('ProjectDetector/Project/readOhPackageJson5')
        .getConsola()
        .error(`Read ${ohPackageJson5Path.fsPath} failed, error:`, JSON.stringify(error))
      return null
    }
  }

  private _buildProfileJson5: DeepPartial<BuildProfile> | null = null

  async readBuildProfileJson5(): Promise<DeepPartial<BuildProfile> | null> {
    if (this._buildProfileJson5 !== null)
      return this._buildProfileJson5
    const buildProfileJson5Path = Utils.joinPath(this.getProjectRoot(), 'build-profile.json5')
    const fs = await this.getProjectDetector().getFileSystem()

    try {
      if (!(await fs.exists(buildProfileJson5Path.fsPath)) || !(await fs.stat(buildProfileJson5Path.fsPath)).isFile())
        return null
      this.getProjectDetector()
        .getLogger('ProjectDetector/Project/readBuildProfileJson5')
        .getConsola()
        .info(`Read build-profile.json5: ${buildProfileJson5Path.toString()}`)
      const buildProfileJson5 = await fs.readFile(buildProfileJson5Path.fsPath, 'utf-8')
      const buildProfile = json5.parse(buildProfileJson5)
      this._buildProfileJson5 = buildProfile
      return buildProfile
    }
    catch (error) {
      this.getProjectDetector()
        .getLogger('ProjectDetector/Project/readBuildProfileJson5')
        .getConsola()
        .error(`Read ${buildProfileJson5Path.fsPath} failed, error:`, JSON.stringify(error))
      return null
    }
  }

  async reset(resetTypes: readonly OpenHarmonyProject.ResetType[] = OpenHarmonyProjectImpl.defaultResetTypes): Promise<void> {
    if (resetTypes.includes('build-profile.json5')) {
      this._buildProfileJson5 = null
      this.getProjectDetector()
        .getLogger('ProjectDetector/Project/reset')
        .getConsola()
        .info(`Reset project: ${this.getProjectRoot().toString()}, build-profile.json5`)
    }
    if (resetTypes.includes('oh-package.json5')) {
      this._ohPackageJson5 = null
      this.getProjectDetector()
        .getLogger('ProjectDetector/Project/reset')
        .getConsola()
        .info(`Reset project: ${this.getProjectRoot().toString()}, oh-package.json5`)
    }
  }
}
