import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  outDir: './out',
  format: ['cjs', 'esm'],
  sourcemap: true,
  clean: true,
  inputOptions: {
    checks: {
      eval: false,
    },
  },
})
