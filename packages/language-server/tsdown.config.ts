import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: './src/index.ts',
  outDir: './out',
  format: ['cjs', 'esm'],
  sourcemap: true,
  dts: true,
  clean: true,
  platform: 'node',
  shims: true,
  inputOptions: {
    checks: {
      eval: false,
    },
  },
})
