<script setup lang="ts">
import {
  BadgeCheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldAlertIcon,
} from '@lucide/vue'
import type { Component } from 'vue'
import type { ScanResult } from '~/types'
import { getQrTypeDef } from '~/lib/qr/registry'
import { useScanActions } from '~/composables/useScanActions'

const props = defineProps<{
  result: ScanResult
}>()

const { run } = useScanActions()

const revealed = reactive<Record<string, boolean>>({})

const def = computed(() => getQrTypeDef(props.result.type))

const ACTION_ICONS: Record<string, Component> = {
  copy: CopyIcon,
  external: ExternalLinkIcon,
  download: DownloadIcon,
}

function actionIcon(icon: string | undefined) {
  return ACTION_ICONS[icon ?? 'copy'] ?? CopyIcon
}
</script>

<template>
  <div class="grid gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <span class="bg-primary/10 text-primary grid size-9 place-items-center rounded-lg">
        <component :is="def.icon" class="size-4" aria-hidden="true" />
      </span>
      <div class="min-w-0">
        <p class="truncate text-sm font-medium">{{ result.label }}</p>
        <p class="text-muted-foreground text-xs">{{ def.label }}</p>
      </div>
      <Badge v-if="!result.unsafe" variant="secondary" class="ml-auto">
        <BadgeCheckIcon />
        Scanned
      </Badge>
    </div>

    <div
      v-if="result.unsafe"
      class="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-xs"
      role="alert"
    >
      <ShieldAlertIcon class="mt-px size-4 shrink-0" aria-hidden="true" />
      <span>
        This code uses a <strong>{{ result.fields.find((field) => field.label === 'Scheme')?.value || 'non-web' }}</strong>
        link. SweetQR will not offer to open it. Only copy it if you trust where it came from.
      </span>
    </div>

    <dl v-if="result.fields.length" class="grid gap-2">
      <div v-for="field in result.fields" :key="field.label" class="grid gap-0.5">
        <dt class="text-muted-foreground text-xs font-medium">{{ field.label }}</dt>
        <dd class="flex items-center gap-2">
          <span class="min-w-0 flex-1 break-all text-sm">
            {{ field.sensitive && !revealed[field.label] ? '••••••••' : field.value }}
          </span>
          <Button
            v-if="field.sensitive"
            variant="ghost"
            size="icon-sm"
            :aria-label="revealed[field.label] ? `Hide ${field.label}` : `Show ${field.label}`"
            @click="revealed[field.label] = !revealed[field.label]"
          >
            <component :is="revealed[field.label] ? EyeOffIcon : EyeIcon" />
          </Button>
        </dd>
      </div>
    </dl>

    <div class="flex flex-wrap gap-2">
      <Button
        v-for="action in result.actions"
        :key="action.label"
        :variant="action.primary ? 'default' : 'outline'"
        size="sm"
        @click="run(action)"
      >
        <component :is="actionIcon(action.icon ?? 'copy')" />
        {{ action.label }}
      </Button>
    </div>
  </div>
</template>
