import type { URI } from 'vscode-uri'
import type { BuildProfile } from '../../types/build-profile'
import type { OhPackageJson5 } from '../../types/oh-package5'
import type { DeepPartial } from '../../types/util'
import type { OpenHarmonyProject } from '../project'
import type { OpenHarmonyProjectDetector } from '../project-detector'
import fs from 'node:fs'
import path from 'node:path'
import json5 from 'json5'

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
    const ohPackageJson5Path = path.resolve(this.getProjectRoot().fsPath, 'oh-package.json5')

    try {
      if (!fs.existsSync(ohPackageJson5Path) || !fs.statSync(ohPackageJson5Path).isFile())
        return null
      const ohPackageJson5 = fs.readFileSync(ohPackageJson5Path, 'utf-8')
      const ohPackage = json5.parse(ohPackageJson5)
      this._ohPackageJson5 = ohPackage
      return ohPackage
    }
    catch (error) {
      console.error(`Read ${ohPackageJson5Path} failed, error:`, error)
      return null
    }
  }

  private _buildProfileJson5: DeepPartial<BuildProfile> | null = null

  async readBuildProfileJson5(): Promise<DeepPartial<BuildProfile> | null> {
    if (this._buildProfileJson5 !== null)
      return this._buildProfileJson5
    const buildProfileJson5Path = path.resolve(this.getProjectRoot().fsPath, 'build-profile.json5')

    try {
      if (!fs.existsSync(buildProfileJson5Path) || !fs.statSync(buildProfileJson5Path).isFile())
        return null
      const buildProfileJson5 = fs.readFileSync(buildProfileJson5Path, 'utf-8')
      const buildProfile = json5.parse(buildProfileJson5)
      this._buildProfileJson5 = buildProfile
      return buildProfile
    }
    catch (error) {
      console.error(`Read ${buildProfileJson5Path} failed, error:`, error)
      return null
    }
  }

  async reset(resetTypes: readonly OpenHarmonyProject.ResetType[] = OpenHarmonyProjectImpl.defaultResetTypes): Promise<void> {
    if (resetTypes.includes('build-profile.json5'))
      this._buildProfileJson5 = null
    if (resetTypes.includes('oh-package.json5'))
      this._ohPackageJson5 = null
  }
}
