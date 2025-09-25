import process from 'node:process'
import fg from 'fast-glob'

export function toPattern(path: string): string {
  return process.platform === 'win32' ? fg.convertPathToPattern(path) : path
}
