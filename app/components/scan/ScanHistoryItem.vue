<script setup lang="ts">
import { CopyIcon, ExternalLinkIcon, Trash2Icon } from '@lucide/vue'
import type { ScanHistoryEntry } from '~/types'
import { getQrTypeDef } from '~/lib/qr/registry'
import { parseQrPayload } from '~/lib/qr/parse'
import { formatDateTime, truncate } from '~/lib/format'
import { useScanActions } from '~/composables/useScanActions'

const props = defineProps<{
  entry: ScanHistoryEntry
}>()

const emit = defineEmits<{ remove: [id: string] }>()

const { run } = useScanActions()

// Re-parsing keeps copy/open behaviour identical to a fresh scan, without storing
// derived action state alongside every history row.
const result = computed(() => parseQrPayload(props.entry.raw))
const def = computed(() => getQrTypeDef(result.value.type))

const copyAction = computed(() => result.value.actions.find((action) => action.kind === 'copy'))
const openAction = computed(() => result.value.actions.find((action) => action.kind === 'open'))
</script>

<template>
  <div class="flex items-start gap-3 px-3 py-3">
    <span class="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-lg">
      <component :is="def.icon" class="size-4" aria-hidden="true" />
    </span>

    <div class="grid min-w-0 flex-1 gap-1">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <p class="min-w-0 truncate text-sm font-medium">{{ entry.label || result.label }}</p>
        <Badge variant="secondary" class="shrink-0">{{ def.label }}</Badge>
        <Badge v-if="result.unsafe" variant="destructive" class="shrink-0">Unsafe link</Badge>
      </div>
      <p class="text-muted-foreground truncate font-mono text-xs" :title="entry.raw">
        {{ truncate(entry.raw, 110) }}
      </p>
      <p class="text-muted-foreground text-xs">{{ formatDateTime(entry.scannedAt) }}</p>
    </div>

    <div class="flex shrink-0 items-center gap-0.5">
      <Button
        v-if="copyAction"
        variant="ghost"
        size="icon-sm"
        :aria-label="`Copy from scan of ${entry.label || entry.raw}`"
        @click="run(copyAction)"
      >
        <CopyIcon />
      </Button>
      <Button
        v-if="openAction"
        variant="ghost"
        size="icon-sm"
        :aria-label="`Open from scan of ${entry.label || entry.raw}`"
        @click="run(openAction)"
      >
        <ExternalLinkIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        class="text-destructive hover:bg-destructive/10"
        :aria-label="`Delete scan of ${entry.label || entry.raw}`"
        @click="emit('remove', entry.id)"
      >
        <Trash2Icon />
      </Button>
    </div>
  </div>
</template>
