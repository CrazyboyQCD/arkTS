import type { Uri } from '@arkts/project-detector'
import type { MediaDirectory } from './media-directory'
import path from 'node:path'

export interface MediaReference {
  getUri(): Uri
  getMediaDirectory(): MediaDirectory
  getRawFileName(): string
  toEtsFormat(): `app.media.${string}`
  toJsonFormat(): `$media:${string}`
}

export namespace MediaReference {
  class MediaReferenceImpl implements MediaReference {
    constructor(
      private readonly uri: Uri,
      private readonly mediaDirectory: MediaDirectory,
    ) {}

    getUri(): Uri {
      return this.uri
    }

    getRawFileName(): string {
      return path.basename(this.uri.fsPath).replace(new RegExp(`${path.extname(this.uri.fsPath)}$`), '')
    }

    toEtsFormat(): `app.media.${string}` {
      return `app.media.${this.getRawFileName()}`
    }

    toJsonFormat(): `$media:${string}` {
      return `$media:${this.getRawFileName()}`
    }

    getMediaDirectory(): MediaDirectory {
      return this.mediaDirectory
    }
  }

  export function is(value: unknown): value is MediaReference {
    return value instanceof MediaReferenceImpl
  }

  export function create(uri: Uri, mediaDirectory: MediaDirectory): MediaReference {
    return new MediaReferenceImpl(uri, mediaDirectory)
  }
}
