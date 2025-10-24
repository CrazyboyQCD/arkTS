export interface SysResource {
  sys: SysResource.System
}

export namespace SysResource {
  export interface System {
    color: Record<string, number>
    float: Record<string, number>
    string: Record<string, number>
    media: Record<string, number>
    symbol: Record<string, number>
    plural: Record<string, number>
  }

  export function is(value: unknown): value is SysResource {
    return typeof value === 'object'
      && value !== null
      && 'sys' in value
      && typeof value.sys === 'object'
      && value.sys !== null
      && Object.entries(value.sys).every(([key, value]) => typeof key === 'string' && typeof value === 'object' && value !== null)
  }

  export async function load(sysResourcePath: string): Promise<SysResource | null> {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const sysResource = require(sysResourcePath)
    if (!is(sysResource)) return null
    return sysResource
  }

  export function toEtsFormat(sysResource: SysResource): string[] {
    return [
      ...new Set(Object.entries(sysResource.sys).flatMap(([key, value]) => Object.entries(value).map(([name]) => `sys.${key}.${name}`))),
    ]
  }
}
