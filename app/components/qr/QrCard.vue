<script setup lang="ts">
import {
  CheckIcon,
  CopyPlusIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
} from '@lucide/vue'
import type { ExportFormat, SavedQrCode } from '~/types'
import { getQrTypeDef } from '~/lib/qr/registry'
import { formatRelativeTime, truncate } from '~/lib/format'
import { cn } from '~/lib/utils'

const props = defineProps<{
  code: SavedQrCode
}>()

const emit = defineEmits<{
  edit: [id: string]
  duplicate: [id: string]
  remove: [id: string]
  rename: [id: string, name: string]
  toggleFavorite: [id: string]
  download: [code: SavedQrCode, format: ExportFormat]
}>()

const def = computed(() => getQrTypeDef(props.code.type))
const renaming = ref(false)
const draft = ref(props.code.name)

function startRenaming() {
  draft.value = props.code.name
  renaming.value = true
  nextTick(() => {
    const input = document.getElementById(`rename-${props.code.id}`) as HTMLInputElement | null
    input?.focus()
    input?.select()
  })
}

function commitRename() {
  if (!renaming.value) return
  renaming.value = false
  if (draft.value.trim() && draft.value.trim() !== props.code.name) {
    emit('rename', props.code.id, draft.value)
  }
}
</script>

<template>
  <Card class="gap-0 overflow-hidden py-4">
    <CardContent class="flex items-start gap-3 px-4">
      <div class="ring-border/60 bg-muted/20 size-16 shrink-0 overflow-hidden rounded-lg p-1.5 ring-1">
        <QrPreview :payload="code.payload" :style="code.style" :resolution="160" />
      </div>

      <div class="grid min-w-0 flex-1 gap-1.5">
        <div class="flex min-w-0 items-center gap-2">
          <form v-if="renaming" class="flex min-w-0 flex-1 items-center gap-1" @submit.prevent="commitRename">
            <Input
              :id="`rename-${code.id}`"
              v-model="draft"
              class="h-7 text-sm"
              maxlength="80"
              :aria-label="`Rename ${code.name}`"
              @blur="commitRename"
              @keydown.esc="renaming = false"
            />
            <Button type="submit" variant="ghost" size="icon-sm" aria-label="Save name">
              <CheckIcon />
            </Button>
            <!-- mousedown.prevent keeps focus in the input, so Cancel does not trigger
                 the blur handler that would commit the rename anyway. -->
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Cancel rename"
              @mousedown.prevent
              @click="renaming = false"
            >
              <XIcon />
            </Button>
          </form>

          <template v-else>
            <button
              type="button"
              class="focus-visible:ring-ring/50 min-w-0 truncate rounded text-left text-sm font-medium outline-none focus-visible:ring-3"
              :title="`Rename ${code.name}`"
              @click="startRenaming"
            >
              {{ code.name }}
            </button>
            <Badge variant="secondary" class="shrink-0">{{ def.label }}</Badge>
          </template>
        </div>

        <p class="text-muted-foreground truncate font-mono text-xs" :title="code.payload">
          {{ truncate(code.payload, 90) }}
        </p>

        <p class="text-muted-foreground text-xs">Updated {{ formatRelativeTime(code.updatedAt) }}</p>
      </div>

      <div class="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          :aria-label="code.favorite ? `Remove ${code.name} from favourites` : `Add ${code.name} to favourites`"
          :aria-pressed="code.favorite"
          @click="emit('toggleFavorite', code.id)"
        >
          <StarIcon :class="cn(code.favorite && 'fill-chart-4 text-chart-4')" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon-sm" :aria-label="`Actions for ${code.name}`">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <DropdownMenuItem @select="emit('edit', code.id)">
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem @select="startRenaming">
              <PencilIcon />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem @select="emit('duplicate', code.id)">
              <CopyPlusIcon />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @select="emit('download', code, 'png')">
              <DownloadIcon />
              Download PNG
            </DropdownMenuItem>
            <DropdownMenuItem @select="emit('download', code, 'svg')">
              <DownloadIcon />
              Download SVG
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" @select="emit('remove', code.id)">
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardContent>
  </Card>
</template>
