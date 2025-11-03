<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon?: string
  selected?: boolean
}>()
</script>

<template>
  <div
    :class="`px-4 py-3 rounded-2px cursor-pointer transition-all duration-200 ${selected ? 'bg-[var(--vscode-inputOption-hoverBackground)]' : ''}`"
    border="~ color-[var(--vscode-input-background)] hover:color-[var(--vscode-inputOption-hoverBackground)] solid 1"
    transform="active:scale-97" flex="~ gap-2 items-center"
  >
    <div v-if="icon" :class="icon" text="3xl" />
    <div flex="~ col gap-0.5">
      <h2 class="text-sm font-bold">
        {{ title }}
      </h2>
      <p class="text-sm text-gray-500">
        {{ description }}
      </p>
    </div>
  </div>
</template>
