import * as l10n from '@vscode/l10n'
import { Service } from 'unioc'
import { IOnActivate } from 'unioc/vscode'
import * as vscode from 'vscode'

export interface LocaleFile {
  locale: string
  content: Record<string, string>
}

export interface TOptions {
  args?: unknown[]
}

@Service
export class Translator implements IOnActivate {
  public static currentLocaleFilePath: string | undefined

  public async getLocaleFilePath(context: vscode.ExtensionContext): Promise<string> {
    if (Translator.currentLocaleFilePath) return Translator.currentLocaleFilePath
    const localeFilePath = vscode.Uri.joinPath(context.extensionUri, `package.nls.${vscode.env.language}.json`).toString()
    const defaultLocaleFilePath = vscode.Uri.joinPath(context.extensionUri, 'package.nls.json').toString()

    const localeFileExist = await vscode.workspace.fs.stat(vscode.Uri.parse(localeFilePath)).then(
      stat => stat.type === vscode.FileType.File,
      () => false,
    )
    Translator.currentLocaleFilePath = localeFileExist ? localeFilePath : defaultLocaleFilePath
    return Translator.currentLocaleFilePath
  }

  async onActivate(context: vscode.ExtensionContext): Promise<void> {
    const uri = await this.getLocaleFilePath(context)
    await l10n.config({ uri })
  }

  public t<TKey extends string>(key: TKey, options: TOptions = {}): string {
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    return l10n.t(key, (options.args ?? []) as Array<l10n.L10nReplacement>)
  }

  public async findAllByCurrentLanguage(): Promise<Record<string, string>> {
    try {
      if (!Translator.currentLocaleFilePath) return {}
      const localeFile = await vscode.workspace.fs.readFile(vscode.Uri.parse(Translator.currentLocaleFilePath))
      return JSON.parse(localeFile.toString())
    }
    catch (error) {
      console.error(error)
      return {}
    }
  }
}
