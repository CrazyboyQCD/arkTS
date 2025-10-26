export interface Permission {
  description: string
  level: string
  type: string
  grantMode: string
  startVersion: number
  note: string
}

export declare interface RecordPermission {
  permissions: Record<string, Permission>
}

export declare const permissions: Record<string, Permission>

export default {
  permissions,
}
