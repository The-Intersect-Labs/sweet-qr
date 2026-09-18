<script setup lang="ts">
import { Loader2Icon, ScanLineIcon, UploadIcon, XIcon } from '@lucide/vue'

const emit = defineEmits<{ scan: [raw: string] }>()

const { decodeFile, decoding, error } = useQrDecodeImage()

const fileInput = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const preview = ref<string | null>(null)
const fileName = ref<string | null>(null)

async function handleFiles(files: FileList | null) {
  const file = files?.[0]
  if (!file) return

  reset()
  fileName.value = file.name
  if (file.type.startsWith('image/')) preview.value = URL.createObjectURL(file)

  const raw = await decodeFile(file)
  if (raw) emit('scan', raw)
}

function reset() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = null
  fileName.value = null
}

function onDrop(event: DragEvent) {
  dragging.value = false
  void handleFiles(event.dataTransfer?.files ?? null)
}

onBeforeUnmount(reset)
</script>

<template>
  <div class="grid gap-3">
    <button
      type="button"
      :class="[
        'focus-visible:ring-ring/50 flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center outline-none transition-colors focus-visible:ring-3',
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
      ]"
      :disabled="decoding"
      @click="fileInput?.click()"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <span class="bg-muted text-muted-foreground grid size-11 place-items-center rounded-xl">
        <UploadIcon class="size-5" aria-hidden="true" />
      </span>
      <span class="text-sm font-medium">
        {{ decoding ? 'Looking for a QR code…' : 'Choose or drop an image' }}
      </span>
      <span class="text-muted-foreground max-w-sm text-xs">
        A screenshot or photo containing a QR code. Images are decoded in your browser and never
        uploaded.
      </span>
      <Loader2Icon v-if="decoding" class="text-muted-foreground size-4 animate-spin" />
    </button>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="sr-only"
      @change="handleFiles(($event.target as HTMLInputElement).files)"
    />

    <div v-if="preview" class="flex items-center gap-3 rounded-xl border p-3">
      <img :src="preview" alt="" class="ring-border size-14 shrink-0 rounded-lg object-cover ring-1">
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">{{ fileName }}</p>
        <p class="text-muted-foreground text-xs">
          {{ decoding ? 'Decoding…' : error ? 'No code found' : 'Decoded' }}
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Clear the selected image" @click="reset">
        <XIcon />
      </Button>
    </div>

    <p v-if="error" class="text-destructive flex items-start gap-1.5 text-xs" role="alert">
      <ScanLineIcon class="mt-px size-3.5 shrink-0" aria-hidden="true" />
      {{ error }}
    </p>
  </div>
</template>
