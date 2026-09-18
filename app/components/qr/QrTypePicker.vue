<script setup lang="ts">
import type { QrTypeId } from '~/types'
import { QR_TYPE_DEFS } from '~/lib/qr/registry'
import { cn } from '~/lib/utils'

const props = defineProps<{
  modelValue: QrTypeId
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: QrTypeId] }>()
</script>

<template>
  <div role="group" aria-label="QR code type" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
    <button
      v-for="def in QR_TYPE_DEFS"
      :key="def.id"
      type="button"
      :disabled="props.disabled"
      :aria-pressed="props.modelValue === def.id"
      :class="
        cn(
          'focus-visible:ring-ring/50 flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-60',
          props.modelValue === def.id
            ? 'border-primary/40 bg-primary/5 ring-primary/20 ring-1'
            : 'border-border hover:bg-muted/50',
        )
      "
      @click="emit('update:modelValue', def.id)"
    >
      <span
        :class="
          cn(
            'grid size-8 shrink-0 place-items-center rounded-lg transition-colors',
            props.modelValue === def.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )
        "
        aria-hidden="true"
      >
        <component :is="def.icon" class="size-4" />
      </span>
      <span class="text-sm font-medium">{{ def.label }}</span>
      <span class="text-muted-foreground line-clamp-2 text-xs leading-snug">{{ def.description }}</span>
    </button>
  </div>
</template>
