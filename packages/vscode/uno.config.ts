import { defineConfig, presetAttributify, presetIcons, presetTypography, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
    presetIcons(),
    presetAttributify(),
    presetTypography(),
    presetIcons(),
  ],
  content: {
    pipeline: {
      include: [/\.(vue|svelte|[jt]sx|ts|vine.ts|mdx?|astro|elm|php|phtml|html)($|\?)/],
    },
  },
})
