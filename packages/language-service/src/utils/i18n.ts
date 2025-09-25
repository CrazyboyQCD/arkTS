export type LocaleStorage = Record<'default' | (string & {}), string>
export function simpleTranslate<TStorage extends LocaleStorage, TKey extends keyof TStorage>(locale: string, storage: TStorage): TStorage[TKey] {
  for (const [key, value] of Object.entries(storage)) {
    if (locale.toLowerCase().includes(key.toLowerCase()))
      return value as TStorage[TKey]
  }
  return storage.default as TStorage[TKey]
}
