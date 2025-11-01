export namespace ConnectionProtocol {
  export interface ServerFunction {
    /**
     * Check if the path exists
     *
     * @param path - The path to check
     * @returns True if the path exists, false otherwise
     */
    checkPathExists(path: string): Promise<boolean>
    /**
     * Get the home directory
     *
     * @returns The home directory
     */
    getHomeDirectory(): Promise<string>
    /**
     * Find all l10n by current language
     *
     * @returns All l10n map by current language
     */
    findAllL10nByCurrentLanguage(): Promise<Record<string, string>>
  }

  export interface ClientFunction {}
}
