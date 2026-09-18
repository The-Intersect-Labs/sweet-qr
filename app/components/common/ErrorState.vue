<script setup lang="ts">
import { TriangleAlertIcon } from '@lucide/vue'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div
    role="alert"
    class="border-destructive/30 bg-destructive/5 flex flex-col items-center gap-3 rounded-xl border p-6 text-center"
  >
    <span class="bg-destructive/10 text-destructive grid size-11 shrink-0 place-items-center rounded-xl">
      <TriangleAlertIcon class="size-5" />
    </span>
    <div class="space-y-1">
      <p class="text-sm font-medium">{{ title }}</p>
      <p v-if="description" class="text-muted-foreground text-sm text-pretty">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="flex flex-wrap justify-center gap-2">
      <slot />
    </div>
  </div>
</template>
