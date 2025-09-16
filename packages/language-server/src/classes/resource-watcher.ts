import type { Connection } from '@volar/language-server'

export class ResourceWatcher {
  protected constructor(protected readonly connection: Connection) {}

  static from(connection: Connection): ResourceWatcher {
    return new ResourceWatcher(connection)
  }
}
