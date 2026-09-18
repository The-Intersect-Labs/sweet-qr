<script setup lang="ts">
import { toast } from 'vue-sonner'
import { QrCodeIcon, SearchIcon, StarIcon, XIcon } from '@lucide/vue'
import type { ExportFormat, QrTypeId, SavedQrCode } from '~/types'
import { QR_TYPE_DEFS } from '~/lib/qr/registry'
import { useQrExport } from '~/composables/useQrExport'
import { cn } from '~/lib/utils'

useSeoMeta({ title: 'My QR codes · SweetQR' })

const { codes, remove, rename, toggleFavorite, duplicate } = useSavedQrCodes()
const { exportQr } = useQrExport()

const search = ref('')
const typeFilter = ref<QrTypeId | 'all'>('all')
const favoritesOnly = ref(false)
const sort = ref<'updated' | 'created' | 'name'>('updated')

const deleteDialogOpen = ref(false)
const deleteTargetId = ref<string | null>(null)

/**
 * Deliberately kept independent of `deleteDialogOpen`: closing the dialog emits
 * update:open, and if that cleared the target it could beat the confirm handler and
 * silently drop the deletion.
 */
const deleteTargetName = computed(
  () => codes.value.find((code) => code.id === deleteTargetId.value)?.name ?? '',
)

function requestDelete(id: string) {
  deleteTargetId.value = id
  deleteDialogOpen.value = true
}

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()

  return codes.value
    .filter((code) => {
      if (favoritesOnly.value && !code.favorite) return false
      if (typeFilter.value !== 'all' && code.type !== typeFilter.value) return false
      if (!query) return true
      return code.name.toLowerCase().includes(query) || code.payload.toLowerCase().includes(query)
    })
    .sort((a, b) => {
      if (sort.value === 'name') return a.name.localeCompare(b.name)
      if (sort.value === 'created') return b.createdAt.localeCompare(a.createdAt)
      return b.updatedAt.localeCompare(a.updatedAt)
    })
})

const typeCounts = computed(() => {
  const counts = new Map<QrTypeId, number>()
  for (const code of codes.value) counts.set(code.type, (counts.get(code.type) ?? 0) + 1)
  return counts
})

const hasFilters = computed(
  () => search.value.trim() !== '' || typeFilter.value !== 'all' || favoritesOnly.value,
)

function clearFilters() {
  search.value = ''
  typeFilter.value = 'all'
  favoritesOnly.value = false
}

function onEdit(id: string) {
  void navigateTo({ path: '/generator', query: { id } })
}

function onDuplicate(id: string) {
  const copy = duplicate(id)
  if (copy) toast.success('Duplicated', { description: copy.name })
}

function onRename(id: string, name: string) {
  const applied = rename(id, name)
  toast.success('Renamed', { description: applied })
}

function onToggleFavorite(id: string) {
  const code = codes.value.find((item) => item.id === id)
  toggleFavorite(id)
  if (code) {
    toast.success(code.favorite ? 'Removed from favourites' : 'Added to favourites', {
      description: code.name,
    })
  }
}

async function onDownload(code: SavedQrCode, format: ExportFormat) {
  try {
    await exportQr(code.payload, code.style, format, code.name)
    toast.success(`${format.toUpperCase()} downloaded`, { description: code.name })
  } catch {
    toast.error('Download failed', { description: 'The QR renderer could not produce this file.' })
  }
}

function confirmDelete() {
  const id = deleteTargetId.value
  const name = deleteTargetName.value
  deleteTargetId.value = null
  deleteDialogOpen.value = false
  if (!id) return

  remove(id)
  toast.success('Deleted', { description: name || 'QR code removed' })
}
</script>

<template>
  <div>
    <PageHeader title="My QR codes" description="Everything you have saved, stored only in this browser.">
      <template #actions>
        <Button as-child>
          <NuxtLink to="/generator">New QR code</NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <ClientOnly>
      <EmptyState
        v-if="codes.length === 0"
        :icon="QrCodeIcon"
        title="No saved QR codes yet"
        description="Generate a code and save it here to build your library. Everything stays on this device."
      >
        <Button as-child>
          <NuxtLink to="/generator">Create your first code</NuxtLink>
        </Button>
      </EmptyState>

      <div v-else class="grid gap-5">
        <div class="grid gap-3">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div class="relative flex-1">
              <SearchIcon
                class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                v-model="search"
                type="search"
                placeholder="Search by name or content…"
                class="pl-8"
                aria-label="Search saved QR codes"
              />
            </div>

            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                :aria-pressed="favoritesOnly"
                :class="cn(favoritesOnly && 'border-chart-4/40 bg-chart-4/10')"
                @click="favoritesOnly = !favoritesOnly"
              >
                <StarIcon :class="cn(favoritesOnly && 'fill-chart-4 text-chart-4')" />
                Favourites
              </Button>

              <Select v-model="sort">
                <SelectTrigger class="w-[9.5rem]" aria-label="Sort saved QR codes">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Recently updated</SelectItem>
                  <SelectItem value="created">Recently created</SelectItem>
                  <SelectItem value="name">Name (A–Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              :aria-pressed="typeFilter === 'all'"
              :class="cn(typeFilter === 'all' && 'border-primary/40 bg-primary/5')"
              @click="typeFilter = 'all'"
            >
              All
              <span class="text-muted-foreground tabular-nums">{{ codes.length }}</span>
            </Button>
            <Button
              v-for="def in QR_TYPE_DEFS"
              :key="def.id"
              variant="outline"
              size="sm"
              :aria-pressed="typeFilter === def.id"
              :class="cn(typeFilter === def.id && 'border-primary/40 bg-primary/5')"
              :disabled="!typeCounts.get(def.id)"
              @click="typeFilter = def.id"
            >
              <component :is="def.icon" />
              {{ def.label }}
              <span class="text-muted-foreground tabular-nums">{{ typeCounts.get(def.id) ?? 0 }}</span>
            </Button>
          </div>
        </div>

        <EmptyState
          v-if="filtered.length === 0"
          :icon="SearchIcon"
          title="No matches"
          description="Nothing here matches your search or filters."
        >
          <Button v-if="hasFilters" variant="outline" @click="clearFilters">
            <XIcon />
            Clear filters
          </Button>
        </EmptyState>

        <div v-else class="grid gap-3">
          <p class="text-muted-foreground text-xs">
            {{ filtered.length }} of {{ codes.length }}
            {{ codes.length === 1 ? 'code' : 'codes' }}
          </p>
          <QrCard
            v-for="code in filtered"
            :key="code.id"
            :code="code"
            @edit="onEdit"
            @duplicate="onDuplicate"
            @rename="onRename"
            @toggle-favorite="onToggleFavorite"
            @download="onDownload"
            @remove="requestDelete"
          />
        </div>
      </div>

      <template #fallback>
        <div class="grid gap-3">
          <Skeleton class="h-9 w-full" />
          <Skeleton class="h-24 w-full" />
          <Skeleton class="h-24 w-full" />
        </div>
      </template>
    </ClientOnly>

    <AlertDialog :open="deleteDialogOpen" @update:open="(open) => (deleteDialogOpen = open)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this QR code?</AlertDialogTitle>
          <AlertDialogDescription>
            “{{ deleteTargetName }}” will be removed from this browser. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive/10 text-destructive hover:bg-destructive/20"
            @click="confirmDelete"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
