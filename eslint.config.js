import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  ignores: [
    'ohos-typescript/**/*',
    'sample/**/*',
    'packages/declarations/ets/**/*',
    'packages/vscode/src/generated/**/*',
  ],
  rules: {
    'ts/no-namespace': 'off',
    'ts/method-signature-style': ['error', 'method'],
  },
  typescript: {
    parserOptions: {
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    },
  },
})
