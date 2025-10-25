import type { Uri } from '@arkts/project-detector'
import type { ProfileDirectory } from './profile-directory'
import path from 'node:path'

export interface ProfileReference {
  getUri(): Uri
  getProfileDirectory(): ProfileDirectory
  getRawFileName(): string
  toEtsFormat(): `app.profile.${string}`
  toJsonFormat(): `$profile:${string}`
}

export namespace ProfileReference {
  class ProfileReferenceImpl implements ProfileReference {
    constructor(
      private readonly uri: Uri,
      private readonly profileDirectory: ProfileDirectory,
    ) {}

    getUri(): Uri {
      return this.uri
    }

    getRawFileName(): string {
      return path.basename(this.uri.fsPath).replace(new RegExp(`${path.extname(this.uri.fsPath)}$`), '')
    }

    toEtsFormat(): `app.profile.${string}` {
      return `app.profile.${this.getRawFileName()}`
    }

    toJsonFormat(): `$profile:${string}` {
      return `$profile:${this.getRawFileName()}`
    }

    getProfileDirectory(): ProfileDirectory {
      return this.profileDirectory
    }
  }

  export function is(value: unknown): value is ProfileReference {
    return value instanceof ProfileReferenceImpl
  }

  export function create(uri: Uri, profileDirectory: ProfileDirectory): ProfileReference {
    return new ProfileReferenceImpl(uri, profileDirectory)
  }
}
