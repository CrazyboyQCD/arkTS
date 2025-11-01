<script setup lang="ts">
import type { ConnectionProtocol } from '../interfaces/connection-protocol'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const productId = route.query.productId as string
if (typeof productId !== 'string') throw new Error('productId is required.')

const isLoading = ref(false)
const error = ref<Error | null>(null)
const isDark = usePreferredDark()
const data = ref<ConnectionProtocol.ServerFunction.RequestTemplateMarketDetail.Response.Result | null>(null)

async function fetchData() {
  try {
    isLoading.value = true
    const response = await window.connection.requestTemplateMarketDetail(productId)
    data.value = response.result
  }
  catch (err) {
    error.value = err as Error
    console.error(err)
  }
  finally {
    isLoading.value = false
  }
}
await fetchData()

const md = new MarkdownIt({
  linkify: true,
  typographer: true,
})
const detailFiles = computed<ConnectionProtocol.ServerFunction.RequestTemplateMarketDetail.Response.Result.DetailFile>(() => {
  try {
    return JSON.parse(data.value?.productEntity.detailFiles ?? '{}')
  }
  catch {
    return []
  }
})
md.renderer.rules.image = (tokens, idx, _options, _env, _self) => {
  const token = tokens[idx]
  const src = token.attrGet('src')?.split('cid:')[1]
  const currentFile = detailFiles.value.image?.find(image => image.fileName === src)
  if (!currentFile) return ''
  return `<img src="${currentFile.filePath}" />`
}
const details = computed(() => md.render(data.value?.productEntity.details ?? ''))
</script>

<template>
  <div>
    <Heading :title="data?.productEntity.productName ?? 'Template Detail'" back>
      <NText op-70>
        productId: {{ productId }}
      </NText>
    </Heading>

    <div v-if="isLoading" flex="~ justify-center items-center" my-10>
      <LoadingSpinner />
    </div>

    <div v-else-if="error" flex="~ justify-center items-center" my-10>
      <div flex="~ col gap-2 items-center" p-4 rounded bg="[var(--vscode-editor-background)]">
        <div i-ph-warning-duotone font-size="2xl" />
        <div>
          {{ error.message }}
        </div>
      </div>
    </div>

    <div v-else>
      <NCard>
        <div flex="~ gap-4">
          <NCarousel touchable w="auto!">
            <NCarouselItem v-for="(image, imageIndex) in data?.productPublicizePicList ?? []" :key="imageIndex" max-w-40>
              <NImage :src="image.picUrl" object-fit="cover" rounded-2px transition="all duration-300" />
            </NCarouselItem>
          </NCarousel>

          <div>
            <NH2 mb0>
              简介
            </NH2>
            <NP>
              {{ data?.productEntity.briefInfo ?? $t('project.templateMarket.noBriefInfo') }}
            </NP>

            <div flex="~ col gap-2">
              <div flex="~ gap-2 items-center wrap">
                <TemplateTag icon="i-ph-clock-duotone" :content="data?.productEntity.updateTime ?? ''" :tooltip="`更新时间: ${data?.productEntity.updateTime}`" />
                <TemplateTag icon="i-ph-star-duotone" :content="data?.productEntity.score?.toString() ?? ''" :tooltip="`评分: ${data?.productEntity.score}`" />
                <TemplateTag icon="i-ph-building-duotone" :content="data?.productEntity.companyName ?? ''" :tooltip="`发行方: ${data?.productEntity.companyName}`" />
                <TemplateTag icon="i-ph-download-duotone" :content="data?.productEntity.saleNum?.toString() ?? ''" :tooltip="`${data?.productEntity.saleNum}次下载`" />
              </div>
            </div>

            <NButton type="primary" mt-5>
              使用此模版
            </NButton>
          </div>
        </div>

        <div
          :class="`${isDark
            ? `prose prose-light prose-code:bg-[var(--vscode-editor-background)]
              prose-pre:bg-[var(--vscode-editor-background)]
              `
            : 'prose-dark'} w-full max-w-none`"
          v-html="details"
        />
      </NCard>
    </div>
  </div>
</template>
