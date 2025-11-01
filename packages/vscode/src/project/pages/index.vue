<script setup lang="ts">
const { projectConfigurations, currentProjectId, currentProject } = await useProjectConfiguration()
const formRef = useTemplateRef<import('naive-ui').FormInst>('formRef')
const router = useRouter()

async function handleSubmit(e: Event) {
  e.preventDefault()
  await formRef.value?.validate()
}

function handleChange() {
  formRef.value?.validate()
}
handleChange()
</script>

<template>
  <div>
    <Heading :title="$t('project.createProject.title')">
      <NButton type="info" @click="router.push('/template-market')">
        <NIcon mr-1>
          <div i-ph-storefront-duotone />
        </NIcon>
        {{ $t('project.templateMarket.title') }}
      </NButton>
      <NButton type="primary" @click="handleSubmit">
        <NIcon mr-1>
          <div i-ph-plus-circle-duotone />
        </NIcon>
        创建
      </NButton>
    </Heading>

    <div flex="~ gap-4 col sm:row justify-between">
      <div class="w-full md:w-2/5">
        <h2 class="text-lg font-bold mb-2">
          应用
        </h2>
        <ul v-for="(item, index) in projectConfigurations" :key="index">
          <li :key="index">
            <ProjectChoice :title="item.title" :description="item.description" :icon="item.icon" :selected="item.id === currentProjectId" />
          </li>
        </ul>
      </div>
      <div class="w-full md:w-3/5">
        <NForm ref="formRef" flex="~ col gap-1" :model="currentProject.input" :rules="currentProject.rules" @submit="handleSubmit">
          <NFormItem v-for="(item, name) in currentProject.input" :key="name" flex="~ col gap-0.5" :path="name.toString()">
            <template #label>
              <div flex="~ gap-1 items-center">
                <div v-if="item.labelIcon" :class="item.labelIcon" />
                {{ item.label }}
              </div>
            </template>
            <NInput v-if="item.type === 'text'" v-model:value="item.value" :placeholder="item.placeholder" :required="item.required" @change="handleChange" />
            <NSelect v-else-if="item.type === 'select'" v-model:value="item.value" :options="item.options" :required="item.required" @change="handleChange" />
            <NCheckboxGroup v-else-if="item.type === 'checkbox'" v-model:value="item.value" :required="item.required" @change="handleChange">
              <NCheckbox v-for="(option, jndex) in item.options" :key="jndex" :value="option.value" :label="option.label" />
            </NCheckboxGroup>
          </NFormItem>
        </NForm>
      </div>
    </div>
  </div>
</template>
