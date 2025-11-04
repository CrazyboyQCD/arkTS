import antfu from '@antfu/eslint-config'
import ifOnelineRule from './scripts/if-oneline.js'

export default antfu({
  type: 'lib',
  ignores: [
    'ohos-typescript/**/*',
    'sample/**/*',
    'packages/declarations/ets/**/*',
    'packages/vscode/src/generated/**/*',
    'packages/vfs/src/**/*',
  ],
  rules: {
    'ts/no-namespace': 'off',
    'ts/method-signature-style': ['error', 'method'],
    'antfu/if-newline': 'off',
    'naily/if-oneline': 'error',
    'ts/no-redeclare': 'off',
    'vue/singleline-html-element-content-newline': 'off',
  },
  plugins: {
    naily: {
      rules: {
        'if-oneline': ifOnelineRule,
      },
    },
  },
  typescript: {
    parserOptions: {
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    },
  },
})
