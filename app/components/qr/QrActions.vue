<script setup lang="ts">
import { toast } from 'vue-sonner'
import { DownloadIcon, Loader2Icon, SaveIcon } from '@lucide/vue'
import type { ExportFormat, QrStyleState } from '~/types'
import { useQrExport } from '~/composables/useQrExport'

const props = defineProps<{
  payload: string
  style: QrStyleState
  name: string
  canSave: boolean
  isEditing: boolean
}>()

const emit = defineEmits<{ save: [] }>()

const { exportQr, exporting } = useQrExport()

async function download(format: ExportFormat) {
  if (!props.payload) return
  try {
    await exportQr(props.payload, props.style, format, props.name)
    toast.success(`${format.toUpperCase()} downloaded`, { description: `${props.style.size} × ${props.style.size} px` })
  } catch {
    toast.error('Download failed', {
      description: 'The QR renderer could not produce this file. Try a smaller size or removing the logo.',
    })
  }
}
</script>

<template>
  <div class="grid gap-2">
    <Button :disabled="!canSave" class="w-full" @click="emit('save')">
      <SaveIcon />
      {{ isEditing ? 'Update saved code' : 'Save to my codes' }}
    </Button>

    <div class="grid grid-cols-2 gap-2">
      <Button variant="outline" :disabled="!payload || exporting !== null" @click="download('png')">
        <Loader2Icon v-if="exporting === 'png'" class="animate-spin" />
        <DownloadIcon v-else />
        PNG
      </Button>
      <Button variant="outline" :disabled="!payload || exporting !== null" @click="download('svg')">
        <Loader2Icon v-if="exporting === 'svg'" class="animate-spin" />
        <DownloadIcon v-else />
        SVG
      </Button>
    </div>

    <p v-if="!payload" class="text-muted-foreground text-center text-xs">
      Fill in the required fields to enable saving and downloading.
    </p>
  </div>
</template>
