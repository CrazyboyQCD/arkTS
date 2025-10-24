export type SerializableTextDocument = Omit<import('vscode-languageserver-textdocument').TextDocument, 'getText' | 'positionAt' | 'offsetAt' | 'lineCount'> & { text: string }
