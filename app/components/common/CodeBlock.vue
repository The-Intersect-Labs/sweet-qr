<script setup lang="ts">
withDefaults(
  defineProps<{
    value: string
    label?: string
  }>(),
  { label: 'Payload' },
)
</script>

<template>
  <div class="bg-muted/40 overflow-hidden rounded-lg border">
    <div class="flex items-center justify-between gap-2 border-b px-3 py-1.5">
      <span class="text-muted-foreground text-xs font-medium">{{ label }}</span>
      <CopyButton :value="value" label="Copy payload" size="xs" variant="ghost" />
    </div>
    <pre class="overflow-x-auto px-3 py-2.5 text-xs leading-relaxed"><code class="break-all whitespace-pre-wrap">{{ value }}</code></pre>
  </div>
</template>
