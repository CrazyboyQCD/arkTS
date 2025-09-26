import type { URI } from 'vscode-uri'
import type { ResourceFolder, ResourceRawFile } from '../../project'
import fs from 'node:fs'
import path from 'node:path'

export class ResourceRawFileImpl implements ResourceRawFile {
  constructor(
    private readonly resourceChildFolder: ResourceFolder,
    private readonly uri: URI,
  ) {}

  getUri(): URI {
    return this.uri
  }

  getResourceFolder(): ResourceFolder {
    return this.resourceChildFolder
  }

  private _isExist: boolean | null = null

  async isExist(force?: boolean): Promise<boolean> {
    if (this._isExist !== null && !force)
      return this._isExist
    this._isExist = fs.existsSync(this.uri.fsPath) && fs.statSync(this.uri.fsPath).isFile()
    return this._isExist
  }

  getRelativePath(): string {
    const parentFolderPath = this.getResourceFolder().getUri().fsPath
    const filePath = this.getUri().fsPath
    return path.relative(parentFolderPath, filePath).replace(/\\/g, '/')
  }

  getCompletionText(currentInput: string): string {
    const relativePath = this.getRelativePath()
    const pathSegments = relativePath.split('/')
    const fileName = pathSegments[pathSegments.length - 1]

    // 如果当前输入为空，返回第一个路径段
    if (!currentInput) {
      return pathSegments[0] || relativePath
    }

    // 如果当前输入完全匹配相对路径，返回当前输入
    if (relativePath === currentInput) {
      return currentInput
    }

    // 检查当前输入是否完全匹配路径的某个部分
    if (pathSegments.includes(currentInput)) {
      return currentInput
    }

    // 检查当前输入是否是路径段的前缀，返回剩余部分
    for (const segment of pathSegments) {
      if (segment.startsWith(currentInput)) {
        return segment.substring(currentInput.length)
      }
    }

    // 如果当前输入是路径的前缀（以/结尾），返回下一个路径段
    if (currentInput.endsWith('/') && relativePath.startsWith(currentInput)) {
      const remainingPath = relativePath.substring(currentInput.length)
      return remainingPath.split('/')[0]
    }

    // 如果当前输入是路径的前缀（不以/结尾），返回下一个路径段
    if (relativePath.startsWith(`${currentInput}/`)) {
      const remainingPath = relativePath.substring(currentInput.length + 1)
      return remainingPath.split('/')[0]
    }

    // 如果当前输入是文件名的前缀，返回剩余部分
    if (fileName.startsWith(currentInput)) {
      return fileName.substring(currentInput.length)
    }

    // 如果当前输入包含路径和文件名前缀，返回剩余部分
    const lastPart = currentInput.split('/').pop() || ''
    if (fileName.startsWith(lastPart)) {
      return fileName.substring(lastPart.length)
    }

    // 如果当前输入是路径的前缀（不以/结尾），返回当前输入
    if (relativePath.startsWith(currentInput)) {
      return currentInput
    }

    // 默认情况，返回第一个路径段
    return pathSegments[0] || relativePath
  }
}
