import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import autoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import components from 'unplugin-vue-components/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import vueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import layouts from 'vite-plugin-vue-layouts'
import { InternalTransformHtmlPlugin } from './scripts/compiled-html-plugin'

export default defineConfig(async () => {
  const unoCSS = await import('unocss/vite')

  return {
    plugins: [
      vueRouter({
        dts: path.resolve(__dirname, 'src/project/routers/typed-router.d.ts'),
        routesFolder: path.resolve(__dirname, 'src/project/pages'),
      }),
      vue(),
      vueJsx(),
      autoImport({
        imports: [
          'vue',
          '@vueuse/core',
          'vue-i18n',
          VueRouterAutoImports,
        ],
        dirs: [
          path.resolve(__dirname, 'src/project/composables'),
        ],
        dts: path.resolve(__dirname, 'src/project/auto-imports.d.ts'),
      }),
      components({
        dirs: [
          path.resolve(__dirname, 'src/project/components'),
        ],
        dts: path.resolve(__dirname, 'src/project/components.d.ts'),
        resolvers: [
          NaiveUiResolver(),
        ],
      }),
      layouts({
        layoutsDirs: path.resolve(__dirname, 'src/project/layouts'),
        defaultLayout: 'Default',
      }),
      unoCSS.default(),
      InternalTransformHtmlPlugin(),
    ],

    resolve: {
      alias: {
        'path': 'path-browserify',
        'node:path': 'path-browserify',
      },
    },

    base: './',

    build: {
      outDir: path.resolve(__dirname, 'build'),
      assetsDir: '.',
      rollupOptions: {
        input: [
          path.resolve(__dirname, 'project.html'),
        ],
      },
    },
  }
})
