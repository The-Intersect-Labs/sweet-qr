<script setup lang="ts">
import { toast } from 'vue-sonner'
import { HistoryIcon, ScanLineIcon, SettingsIcon, Trash2Icon } from '@lucide/vue'
import type { ScanHistoryEntry } from '~/types'
import { formatDayLabel } from '~/lib/format'
import { useScanHistory } from '~/composables/useScanHistory'

useSeoMeta({ title: 'Scan history · SweetQR' })

const { entries, remove, clear, historyEnabled } = useScanHistory()

const clearDialogOpen = ref(false)

/** Newest first, grouped under a human day heading. */
const grouped = computed(() => {
  const groups: { day: string; items: ScanHistoryEntry[] }[] = []

  for (const entry of entries.value) {
    const day = formatDayLabel(entry.scannedAt)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(entry)
    else groups.push({ day, items: [entry] })
  }

  return groups
})

function onRemove(id: string) {
  remove(id)
  toast.success('Removed from history')
}

function confirmClear() {
  const count = entries.value.length
  clear()
  clearDialogOpen.value = false
  toast.success('History cleared', { description: `${count} ${count === 1 ? 'entry' : 'entries'} removed` })
}
</script>

<template>
  <div>
    <PageHeader title="Scan history" description="Every code you have scanned, stored on this device.">
      <template #actions>
        <Button as-child variant="outline" size="sm">
          <NuxtLink to="/scanner">
            <ScanLineIcon />
            Scan a code
          </NuxtLink>
        </Button>
        <Button
          v-if="entries.length"
          variant="outline"
          size="sm"
          class="text-destructive hover:bg-destructive/10"
          @click="clearDialogOpen = true"
        >
          <Trash2Icon />
          Clear all
        </Button>
      </template>
    </PageHeader>

    <ClientOnly>
      <div
        v-if="!historyEnabled"
        class="border-border/70 bg-muted/20 flex flex-col items-center gap-3 rounded-xl border p-6 text-center"
      >
        <span class="bg-muted text-muted-foreground grid size-11 place-items-center rounded-xl">
          <HistoryIcon class="size-5" />
        </span>
        <div class="space-y-1">
          <p class="text-sm font-medium">Scan history is turned off</p>
          <p class="text-muted-foreground text-sm text-pretty">
            New scans won't be recorded. Anything already here stays until you clear it.
          </p>
        </div>
        <Button as-child variant="outline">
          <NuxtLink to="/settings">
            <SettingsIcon />
            Change in settings
          </NuxtLink>
        </Button>
      </div>

      <EmptyState
        v-else-if="entries.length === 0"
        :icon="HistoryIcon"
        title="No scans yet"
        description="Scan a QR code with your camera or from an image and it will show up here."
      >
        <Button as-child>
          <NuxtLink to="/scanner">Open the scanner</NuxtLink>
        </Button>
      </EmptyState>

      <div v-else class="grid gap-5">
        <section v-for="group in grouped" :key="group.day" class="grid gap-2">
          <h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {{ group.day }}
          </h2>
          <Card class="gap-0 divide-y overflow-hidden py-0">
            <ScanHistoryItem
              v-for="entry in group.items"
              :key="entry.id"
              :entry="entry"
              @remove="onRemove"
            />
          </Card>
        </section>
      </div>

      <template #fallback>
        <div class="grid gap-3">
          <Skeleton class="h-20 w-full" />
          <Skeleton class="h-20 w-full" />
        </div>
      </template>
    </ClientOnly>

    <AlertDialog :open="clearDialogOpen" @update:open="(open) => (clearDialogOpen = open)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear all scan history?</AlertDialogTitle>
          <AlertDialogDescription>
            All {{ entries.length }} saved {{ entries.length === 1 ? 'entry' : 'entries' }} will be
            removed from this browser. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive/10 text-destructive hover:bg-destructive/20"
            @click="confirmClear"
          >
            Clear all
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
