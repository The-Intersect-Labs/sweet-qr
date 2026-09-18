<script setup lang="ts">
import { ImagePlusIcon, RotateCcwIcon, TriangleAlertIcon, Trash2Icon } from '@lucide/vue'
import type { CornerDotStyle, CornerSquareStyle, DotStyle, ErrorCorrectionLevel, QrStyleState } from '~/types'
import { QR_STYLE_LIMITS } from '~/types'
import { hasLowContrast } from '~/lib/contrast'
import { useLogoUpload } from '~/composables/useLogoUpload'

const props = withDefaults(
  defineProps<{
    style: QrStyleState
    defaultStyle: QrStyleState
    resetLabel?: string
  }>(),
  { resetLabel: 'Reset to my defaults' },
)

const emit = defineEmits<{ change: [patch: Partial<QrStyleState>] }>()

const { readLogo, error: logoError, processing } = useLogoUpload()
const fileInput = ref<HTMLInputElement | null>(null)
const dragging = ref(false)

const DOT_STYLES: { label: string; value: DotStyle }[] = [
  { label: 'Square', value: 'square' },
  { label: 'Dots', value: 'dots' },
  { label: 'Rounded', value: 'rounded' },
  { label: 'Classy', value: 'classy' },
  { label: 'Classy rounded', value: 'classy-rounded' },
  { label: 'Extra rounded', value: 'extra-rounded' },
]

const CORNER_SQUARE_STYLES: { label: string; value: CornerSquareStyle }[] = [
  { label: 'Square', value: 'square' },
  { label: 'Dot', value: 'dot' },
  { label: 'Extra rounded', value: 'extra-rounded' },
]

const CORNER_DOT_STYLES: { label: string; value: CornerDotStyle }[] = [
  { label: 'Dot', value: 'dot' },
  { label: 'Square', value: 'square' },
]

const ERROR_LEVELS: { label: string; value: ErrorCorrectionLevel }[] = [
  { label: 'L — 7% recovery', value: 'L' },
  { label: 'M — 15% recovery', value: 'M' },
  { label: 'Q — 25% recovery', value: 'Q' },
  { label: 'H — 30% recovery', value: 'H' },
]

const lowContrast = computed(() => hasLowContrast(props.style.fgColor, props.style.bgColor))
const logoNeedsHighRecovery = computed(
  () => Boolean(props.style.logo) && (props.style.errorCorrection === 'L' || props.style.errorCorrection === 'M'),
)

function selectValue(key: 'dotStyle' | 'cornerSquareStyle' | 'cornerDotStyle' | 'errorCorrection', value: unknown) {
  if (typeof value !== 'string' || !value) return
  emit('change', { [key]: value } as Partial<QrStyleState>)
}

async function handleFiles(files: FileList | null) {
  const file = files?.[0]
  if (!file) return
  const dataUrl = await readLogo(file)
  if (dataUrl) emit('change', { logo: dataUrl })
}

function onDrop(event: DragEvent) {
  dragging.value = false
  void handleFiles(event.dataTransfer?.files ?? null)
}

function reset() {
  emit('change', { ...props.defaultStyle })
}
</script>

<template>
  <div class="grid gap-5">
    <section class="grid gap-2">
      <h3 class="text-sm font-medium">Presets</h3>
      <StylePresets :style="style" @apply="(patch) => emit('change', patch)" />
    </section>

    <Separator />

    <section class="grid gap-4">
      <h3 class="text-sm font-medium">Colours</h3>
      <QrColorControl
        label="Foreground"
        :color="style.fgColor"
        :gradient="style.fgGradient"
        @update:color="(value) => emit('change', { fgColor: value })"
        @update:gradient="(value) => emit('change', { fgGradient: value })"
      />
      <QrColorControl
        label="Background"
        allow-transparent
        :color="style.bgColor"
        :gradient="style.bgGradient"
        @update:color="(value) => emit('change', { bgColor: value })"
        @update:gradient="(value) => emit('change', { bgGradient: value })"
      />

      <p
        v-if="lowContrast"
        class="border-chart-4/40 bg-chart-4/10 text-foreground flex items-start gap-2 rounded-lg border p-2.5 text-xs"
        role="status"
      >
        <TriangleAlertIcon class="mt-px size-3.5 shrink-0" aria-hidden="true" />
        <span>Low contrast between dots and background — this QR code may be hard for scanners to read.</span>
      </p>
    </section>

    <Separator />

    <section class="grid gap-3">
      <h3 class="text-sm font-medium">Shape</h3>

      <div class="grid gap-1.5">
        <Label for="qr-dot-style" class="text-xs">Dot style</Label>
        <Select :model-value="style.dotStyle" @update:model-value="(value) => selectValue('dotStyle', value)">
          <SelectTrigger id="qr-dot-style" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in DOT_STYLES" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-1.5">
        <Label for="qr-corner-square" class="text-xs">Corner style</Label>
        <Select
          :model-value="style.cornerSquareStyle"
          @update:model-value="(value) => selectValue('cornerSquareStyle', value)"
        >
          <SelectTrigger id="qr-corner-square" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in CORNER_SQUARE_STYLES" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-1.5">
        <Label for="qr-corner-dot" class="text-xs">Corner dot style</Label>
        <Select
          :model-value="style.cornerDotStyle"
          @update:model-value="(value) => selectValue('cornerDotStyle', value)"
        >
          <SelectTrigger id="qr-corner-dot" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in CORNER_DOT_STYLES" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>

    <Separator />

    <section class="grid gap-4">
      <h3 class="text-sm font-medium">Output</h3>

      <div class="grid gap-1.5">
        <div class="flex items-center justify-between">
          <Label for="qr-size" class="text-xs">Size</Label>
          <span class="text-xs tabular-nums">{{ style.size }} px</span>
        </div>
        <Slider
          :model-value="[style.size]"
          :min="QR_STYLE_LIMITS.size.min"
          :max="QR_STYLE_LIMITS.size.max"
          :step="QR_STYLE_LIMITS.size.step"
          aria-label="Export size in pixels"
          @update:model-value="(value) => emit('change', { size: Number(value?.[0] ?? style.size) })"
        />
      </div>

      <div class="grid gap-1.5">
        <div class="flex items-center justify-between">
          <Label for="qr-margin" class="text-xs">Margin</Label>
          <span class="text-xs tabular-nums">{{ style.margin }} px</span>
        </div>
        <Slider
          :model-value="[style.margin]"
          :min="QR_STYLE_LIMITS.margin.min"
          :max="QR_STYLE_LIMITS.margin.max"
          :step="QR_STYLE_LIMITS.margin.step"
          aria-label="Quiet zone margin in pixels"
          @update:model-value="(value) => emit('change', { margin: Number(value?.[0] ?? style.margin) })"
        />
        <p class="text-muted-foreground text-xs">
          A margin of at least 16 px keeps the quiet zone scanners need.
        </p>
      </div>

      <div class="grid gap-1.5">
        <Label for="qr-ecc" class="text-xs">Error correction</Label>
        <Select
          :model-value="style.errorCorrection"
          @update:model-value="(value) => selectValue('errorCorrection', value)"
        >
          <SelectTrigger id="qr-ecc" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in ERROR_LEVELS" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="logoNeedsHighRecovery" class="text-muted-foreground text-xs">
          With a centre logo, level H is recommended so the code still scans.
        </p>
      </div>
    </section>

    <Separator />

    <section class="grid gap-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-sm font-medium">Centre logo</h3>
        <Button v-if="style.logo" variant="ghost" size="xs" @click="emit('change', { logo: null })">
          <Trash2Icon />
          Remove
        </Button>
      </div>

      <div v-if="style.logo" class="flex items-center gap-3">
        <img
          :src="style.logo"
          alt="Centre logo preview"
          class="ring-border size-14 shrink-0 rounded-lg object-contain ring-1"
        />
        <div class="grid flex-1 gap-3">
          <div class="grid gap-1.5">
            <div class="flex items-center justify-between">
              <Label class="text-xs">Logo size</Label>
              <span class="text-xs tabular-nums">{{ Math.round(style.logoSize * 100) }}%</span>
            </div>
            <Slider
              :model-value="[style.logoSize]"
              :min="QR_STYLE_LIMITS.logoSize.min"
              :max="QR_STYLE_LIMITS.logoSize.max"
              :step="QR_STYLE_LIMITS.logoSize.step"
              aria-label="Logo size as a share of the code"
              @update:model-value="(value) => emit('change', { logoSize: Number(value?.[0] ?? style.logoSize) })"
            />
          </div>
          <div class="grid gap-1.5">
            <div class="flex items-center justify-between">
              <Label class="text-xs">Logo padding</Label>
              <span class="text-xs tabular-nums">{{ style.logoMargin }} px</span>
            </div>
            <Slider
              :model-value="[style.logoMargin]"
              :min="QR_STYLE_LIMITS.logoMargin.min"
              :max="QR_STYLE_LIMITS.logoMargin.max"
              :step="QR_STYLE_LIMITS.logoMargin.step"
              aria-label="Logo padding in pixels"
              @update:model-value="(value) => emit('change', { logoMargin: Number(value?.[0] ?? style.logoMargin) })"
            />
          </div>
        </div>
      </div>

      <div v-else class="grid gap-2">
        <button
          type="button"
          :class="[
            'focus-visible:ring-ring/50 flex flex-col items-center gap-1.5 rounded-xl border border-dashed p-4 text-center outline-none transition-colors focus-visible:ring-3',
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
          ]"
          :disabled="processing"
          @click="fileInput?.click()"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
        >
          <ImagePlusIcon class="text-muted-foreground size-4" aria-hidden="true" />
          <span class="text-xs font-medium">{{ processing ? 'Processing image…' : 'Upload a logo' }}</span>
          <span class="text-muted-foreground text-xs">PNG, JPEG, WebP or SVG · up to 5 MB · dropped or clicked</span>
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          class="sr-only"
          @change="handleFiles(($event.target as HTMLInputElement).files)"
        />
      </div>

      <p v-if="logoError" class="text-destructive text-xs" role="alert">{{ logoError }}</p>
      <p v-else-if="style.logo" class="text-muted-foreground text-xs">
        Raster logos are downscaled to 256 px so your saved codes stay small.
      </p>
    </section>

    <Separator />

    <Button variant="outline" size="sm" class="justify-center" @click="reset">
      <RotateCcwIcon />
      {{ resetLabel }}
    </Button>
  </div>
</template>
