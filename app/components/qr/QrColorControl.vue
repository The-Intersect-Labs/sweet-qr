<script setup lang="ts">
import type { QrGradient, GradientType, QrGradientStop } from '~/types'
import { cn } from '~/lib/utils'

const props = withDefaults(
  defineProps<{
    label: string
    color: string
    gradient: QrGradient | null
    allowTransparent?: boolean
  }>(),
  { allowTransparent: false },
)

const emit = defineEmits<{
  'update:color': [value: string]
  'update:gradient': [value: QrGradient | null]
}>()

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const FALLBACK_COLOR = '#000000'

const isTransparent = computed(() => props.color.trim().toLowerCase() === 'transparent')

function expand(hex: string): string {
  const value = hex.replace(/^#/, '')
  return value.length === 3 ? `#${value.replace(/./g, '$&$&')}` : `#${value}`
}

/** Native colour inputs only accept #rrggbb, so normalise and fall back safely. */
const pickerValue = computed(() => (HEX_PATTERN.test(props.color) ? expand(props.color) : FALLBACK_COLOR))

const hexDraft = ref(props.color)
watch(
  () => props.color,
  (value) => {
    hexDraft.value = value
  },
)

function onHexInput(value: string) {
  hexDraft.value = value
  if (HEX_PATTERN.test(value.trim())) emit('update:color', value.trim())
}

function setGradientType(type: GradientType) {
  if (!props.gradient) return
  emit('update:gradient', { ...props.gradient, type })
}

function setGradientRotation(rotation: number) {
  if (!props.gradient) return
  emit('update:gradient', { ...props.gradient, rotation })
}

function setStopColor(index: number, color: string) {
  if (!props.gradient) return
  const colorStops = props.gradient.colorStops.map((stop, i) => (i === index ? { ...stop, color } : stop)) as QrGradientStop[]
  emit('update:gradient', { ...props.gradient, colorStops })
}

function toggleGradient(enabled: boolean) {
  emit(
    'update:gradient',
    enabled
      ? {
          type: 'linear',
          rotation: 45,
          colorStops: [
            { offset: 0, color: pickerValue.value },
            { offset: 1, color: '#8b5cf6' },
          ],
        }
      : null,
  )
}

const gradientPreview = computed(() => {
  if (!props.gradient) return undefined
  const stops = [...props.gradient.colorStops]
    .sort((a, b) => a.offset - b.offset)
    .map((stop) => stop.color)
    .join(', ')
  const angle = props.gradient.type === 'linear' ? `${props.gradient.rotation}deg` : '135deg'
  return props.gradient.type === 'linear' ? `linear-gradient(${angle}, ${stops})` : `radial-gradient(circle, ${stops})`
})
</script>

<template>
  <div class="grid gap-2">
    <div class="flex items-center justify-between gap-2">
      <Label :for="`${label}-color`" class="text-xs">{{ label }}</Label>
      <label v-if="allowTransparent" class="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Checkbox
          :model-value="isTransparent"
          @update:model-value="(value) => emit('update:color', value === true ? 'transparent' : FALLBACK_COLOR)"
        />
        Transparent
      </label>
    </div>

    <div v-if="!isTransparent" class="flex items-center gap-2">
      <input
        :id="`${label}-color`"
        type="color"
        :value="pickerValue"
        class="border-input size-9 shrink-0 cursor-pointer rounded-lg border bg-transparent p-0.5"
        :aria-label="`${label} colour`"
        @input="emit('update:color', ($event.target as HTMLInputElement).value)"
      />
      <Input
        :model-value="hexDraft"
        class="h-9 font-mono text-xs"
        spellcheck="false"
        :aria-label="`${label} hex value`"
        @update:model-value="(value) => onHexInput(String(value))"
      />
    </div>

    <div v-else class="text-muted-foreground rounded-lg border border-dashed px-2.5 py-1.5 text-xs">
      No background — the QR sits directly on whatever surface it is placed on.
    </div>

    <div v-if="!isTransparent" class="flex items-center justify-between gap-2">
      <label class="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Switch
          size="sm"
          :model-value="gradient !== null"
          @update:model-value="(value) => toggleGradient(value === true)"
        />
        Gradient
      </label>
      <span
        v-if="gradientPreview"
        class="ring-border h-6 w-16 rounded-md ring-1"
        :style="{ background: gradientPreview }"
        aria-hidden="true"
      />
    </div>

    <div v-if="gradient" class="bg-muted/30 grid gap-2.5 rounded-lg border p-2.5">
      <div class="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          :class="cn(gradient.type === 'linear' && 'border-primary/40 bg-primary/5')"
          :aria-pressed="gradient.type === 'linear'"
          @click="setGradientType('linear')"
        >
          Linear
        </Button>
        <Button
          variant="outline"
          size="sm"
          :class="cn(gradient.type === 'radial' && 'border-primary/40 bg-primary/5')"
          :aria-pressed="gradient.type === 'radial'"
          @click="setGradientType('radial')"
        >
          Radial
        </Button>
      </div>

      <div v-if="gradient.type === 'linear'" class="grid gap-1.5">
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground text-xs">Angle</span>
          <span class="text-xs tabular-nums">{{ Math.round(gradient.rotation) }}°</span>
        </div>
        <Slider
          :model-value="[gradient.rotation]"
          :min="0"
          :max="360"
          :step="5"
          :aria-label="`${label} gradient angle`"
          @update:model-value="(value) => setGradientRotation(Number(value?.[0] ?? 0))"
        />
      </div>

      <div class="grid gap-2">
        <div v-for="(stop, index) in gradient.colorStops" :key="index" class="flex items-center gap-2">
          <span class="text-muted-foreground w-10 text-xs">{{ index === 0 ? 'From' : 'To' }}</span>
          <input
            type="color"
            :value="stop.color"
            class="border-input size-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
            :aria-label="`${label} gradient ${index === 0 ? 'start' : 'end'} colour`"
            @input="setStopColor(index, ($event.target as HTMLInputElement).value)"
          />
          <Input
            :model-value="stop.color"
            class="h-8 font-mono text-xs"
            spellcheck="false"
            :aria-label="`${label} gradient ${index === 0 ? 'start' : 'end'} hex value`"
            @update:model-value="(value) => HEX_PATTERN.test(String(value).trim()) && setStopColor(index, String(value).trim())"
          />
        </div>
      </div>
    </div>
  </div>
</template>
