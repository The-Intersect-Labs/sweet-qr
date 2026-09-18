<script setup lang="ts">
import type QRCodeStyling from 'qr-code-styling'
import type { QrStyleState } from '~/types'
import { PREVIEW_RESOLUTION, buildQrOptions, isTransparent } from '~/composables/useQrRenderOptions'

const props = withDefaults(
  defineProps<{
    payload: string
    style: QrStyleState
    /** Internal render resolution. Lower it for thumbnails to keep lists cheap. */
    resolution?: number
  }>(),
  { resolution: PREVIEW_RESOLUTION },
)

const container = ref<HTMLElement | null>(null)
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')

let instance: QRCodeStyling | null = null
let debounce: ReturnType<typeof setTimeout> | undefined

const checkerboard = computed(() =>
  isTransparent(props.style.bgColor) && !props.style.bgGradient
    ? {
        backgroundImage:
          'repeating-conic-gradient(var(--muted) 0% 25%, transparent 0% 50%)',
        backgroundSize: '16px 16px',
      }
    : {},
)

/**
 * qr-code-styling renders an <svg> with fixed width/height attributes, which will not
 * scale inside a fluid container. Give it a viewBox and let CSS size it instead.
 */
function makeScalable() {
  const svg = container.value?.querySelector('svg')
  if (!svg) return
  svg.setAttribute('viewBox', `0 0 ${props.resolution} ${props.resolution}`)
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
}

function render() {
  const el = container.value
  if (!instance || !el) return

  if (!props.payload) {
    el.replaceChildren()
    return
  }

  instance.update(
    buildQrOptions({ payload: props.payload, style: props.style, resolution: props.resolution }),
  )
  requestAnimationFrame(makeScalable)
}

onMounted(async () => {
  status.value = 'loading'
  try {
    const { default: QRCodeStylingCtor } = await import('qr-code-styling')
    instance = new QRCodeStylingCtor(
      buildQrOptions({
        payload: props.payload || ' ',
        style: props.style,
        resolution: props.resolution,
      }),
    )
    if (!container.value) return
    instance.append(container.value)
    // Nothing to show yet: drop the placeholder render so it cannot peek out behind
    // the empty-state overlay.
    if (!props.payload) container.value.replaceChildren()
    requestAnimationFrame(makeScalable)
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
})

// Style edits arrive in bursts (dragging a slider); debounce so we don't re-render
// the SVG on every input event.
watch(
  () => [props.payload, props.style] as const,
  () => {
    if (status.value === 'error') return
    if (debounce) clearTimeout(debounce)
    debounce = setTimeout(render, 120)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce)
  instance = null
})
</script>

<template>
  <div class="flex w-full flex-col items-center gap-3">
    <div
      class="ring-border/60 relative aspect-square w-full overflow-hidden rounded-xl ring-1 transition-colors"
      :style="checkerboard"
    >
      <div
        v-if="status !== 'error'"
        ref="container"
        class="qr-preview absolute inset-0 grid place-items-center [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
        :aria-hidden="payload ? undefined : true"
        :role="payload ? 'img' : undefined"
        :aria-label="payload ? 'QR code preview' : undefined"
      />

      <div v-if="status === 'loading'" class="bg-muted/40 absolute inset-0 animate-pulse" />

      <div
        v-if="!payload"
        class="bg-background text-muted-foreground absolute inset-0 grid place-items-center p-6 text-center text-xs"
      >
        Fill in the form to see your QR code
      </div>

      <div
        v-else-if="status === 'error'"
        class="bg-background text-muted-foreground absolute inset-0 grid place-items-center p-6 text-center text-xs"
      >
        The QR renderer could not be loaded.
      </div>
    </div>
  </div>
</template>
