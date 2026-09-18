<script setup lang="ts">
import { CheckIcon } from '@lucide/vue'
import type { QrStyleState } from '~/types'
import { STYLE_PRESETS, type StylePreset } from '~/lib/qr/presets'
import { cn } from '~/lib/utils'

const props = defineProps<{
  style: QrStyleState
}>()

const emit = defineEmits<{ apply: [style: Partial<QrStyleState>] }>()

function matchesPreset(preset: StylePreset) {
  return Object.entries(preset.style).every(
    ([key, value]) => JSON.stringify(props.style[key as keyof QrStyleState]) === JSON.stringify(value),
  )
}
</script>

<template>
  <div class="grid gap-2">
    <p class="text-muted-foreground text-xs">Starting points — tweak anything below afterwards.</p>
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <button
        v-for="preset in STYLE_PRESETS"
        :key="preset.id"
        type="button"
        :aria-pressed="matchesPreset(preset)"
        :class="
          cn(
            'focus-visible:ring-ring/50 group relative flex flex-col gap-2 rounded-xl border p-2.5 text-left outline-none transition-colors focus-visible:ring-3',
            matchesPreset(preset) ? 'border-primary/40 bg-primary/5 ring-primary/20 ring-1' : 'border-border hover:bg-muted/50',
          )
        "
        :title="preset.description"
        @click="emit('apply', preset.style)"
      >
        <span
          class="grid h-10 w-full place-items-center rounded-lg border"
          :style="{
            background:
              preset.style.bgColor === 'transparent' ? 'repeating-conic-gradient(var(--muted) 0% 25%, transparent 0% 50%)' : preset.style.bgColor,
            backgroundSize: preset.style.bgColor === 'transparent' ? '10px 10px' : undefined,
          }"
          aria-hidden="true"
        >
          <span
            class="size-5 rounded-[6px]"
            :style="{
              background: preset.style.fgGradient
                ? `linear-gradient(135deg, ${preset.style.fgGradient.colorStops.map((stop) => stop.color).join(', ')})`
                : preset.style.fgColor,
            }"
          />
        </span>
        <span class="flex items-center gap-1">
          <span class="truncate text-xs font-medium">{{ preset.label }}</span>
          <CheckIcon v-if="matchesPreset(preset)" class="text-primary size-3 shrink-0" aria-hidden="true" />
        </span>
      </button>
    </div>
  </div>
</template>
