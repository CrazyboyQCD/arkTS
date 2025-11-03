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
        dts: 'src/project/routers/typed-router.d.ts',
        routesFolder: 'src/project/pages',
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
          'src/project/composables',
        ],
        dts: 'src/project/auto-imports.d.ts',
      }),
      components({
        dirs: [
          'src/project/components',
        ],
        dts: 'src/project/components.d.ts',
        resolvers: [
          NaiveUiResolver(),
        ],
      }),
      layouts({
        layoutsDirs: 'src/project/layouts',
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
      outDir: 'build',
      assetsDir: '.',
      rollupOptions: {
        input: [
          'project.html',
        ],
      },
    },
  }
})
