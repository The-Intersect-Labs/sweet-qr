<script setup lang="ts">
import { toast } from 'vue-sonner'
import { DatabaseIcon, InfoIcon, MonitorIcon, MoonIcon, ShieldCheckIcon, SunIcon, Trash2Icon } from '@lucide/vue'
import type { ExportFormat } from '~/types'
import { createDefaultStyle } from '~/lib/storage'

useSeoMeta({ title: 'Settings · SweetQR' })

const { settings, updateSettings, updateDefaultStyle, resetDefaultStyle, setHistoryEnabled } = useSettings()
const { codes, clear: clearCodes } = useSavedQrCodes()
const { entries, clear: clearHistory } = useScanHistory()
const { state: persistenceState, refresh: refreshPersistence, request: requestPersistence } =
  useStoragePersistence()

onMounted(() => {
  void refreshPersistence()
})

const persistenceCopy = computed(() => {
  switch (persistenceState.value) {
    case 'granted':
      return {
        title: 'Your library is protected',
        detail:
          'This browser has agreed not to clear SweetQR automatically when the device runs low on space.',
      }
    case 'requesting':
      return { title: 'Asking your browser…', detail: 'Confirm the prompt to protect your library.' }
    case 'unsupported':
      return {
        title: 'Persistent storage is not available here',
        detail:
          'This browser (Safari) does not offer it. Adding SweetQR to your home screen is what stops your data being cleared automatically.',
      }
    case 'denied':
      return {
        title: 'Your library is not protected yet',
        detail:
          'This browser may clear SweetQR\u2019s data if it runs low on space. Installing the app usually grants protection.',
      }
    default:
      return { title: 'Storage protection unknown', detail: 'Checking whether this browser will keep your library safe.' }
  }
})

const colorMode = useColorMode()

const factoryStyle = createDefaultStyle()

const THEMES = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: MonitorIcon },
] as const

const EXPORT_FORMATS: { value: ExportFormat; label: string; hint: string }[] = [
  { value: 'png', label: 'PNG', hint: 'Best for sharing and printing.' },
  { value: 'svg', label: 'SVG', hint: 'Vector, scales to any size.' },
]

/**
 * `confirmAction` is intentionally not cleared when the dialog closes: reka emits
 * update:open as part of the confirm click, and clearing there can beat the handler
 * that actually performs the action.
 */
const confirmDialogOpen = ref(false)
const confirmAction = ref<'codes' | 'history' | 'everything' | null>(null)

function requestAction(action: 'codes' | 'history' | 'everything') {
  confirmAction.value = action
  confirmDialogOpen.value = true
}

const storedSummary = computed(() => ({
  codes: codes.value.length,
  entries: entries.value.length,
}))

const confirmCopy = computed(() => {
  switch (confirmAction.value) {
    case 'codes':
      return {
        title: 'Delete all saved QR codes?',
        description: `All ${storedSummary.value.codes} saved codes will be removed from this browser. This cannot be undone.`,
        action: 'Delete codes',
      }
    case 'history':
      return {
        title: 'Clear scan history?',
        description: `All ${storedSummary.value.entries} history entries will be removed from this browser. This cannot be undone.`,
        action: 'Clear history',
      }
    default:
      return {
        title: 'Erase all SweetQR data?',
        description:
          'Saved codes, scan history and settings will be removed from this browser. This cannot be undone.',
        action: 'Erase everything',
      }
  }
})

function runConfirmedAction() {
  const action = confirmAction.value
  confirmAction.value = null
  confirmDialogOpen.value = false
  if (!action) return

  if (action === 'codes') {
    clearCodes()
    toast.success('Saved codes deleted')
    return
  }
  if (action === 'history') {
    clearHistory()
    toast.success('Scan history cleared')
    return
  }
  if (action === 'everything') {
    clearCodes()
    clearHistory()
    resetDefaultStyle()
    updateSettings({ historyEnabled: true, defaultExport: 'png' })
    toast.success('All SweetQR data erased')
  }
}
</script>

<template>
  <div>
    <PageHeader title="Settings" description="Preferences, defaults and everything stored on this device." />

    <ClientOnly>
      <div class="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Appearance</CardTitle>
            <CardDescription>SweetQR follows your system theme by default.</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-3">
            <div class="flex flex-wrap gap-2" role="group" aria-label="Colour theme">
              <Button
                v-for="theme in THEMES"
                :key="theme.value"
                variant="outline"
                :aria-pressed="colorMode.preference === theme.value"
                :class="colorMode.preference === theme.value ? 'border-primary/40 bg-primary/5' : undefined"
                @click="colorMode.preference = theme.value"
              >
                <component :is="theme.icon" />
                {{ theme.label }}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">Scanning</CardTitle>
            <CardDescription>Control what the scanner keeps.</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div class="grid gap-0.5">
                <Label for="history-enabled" class="cursor-pointer">Save scan history</Label>
                <p class="text-muted-foreground text-xs text-pretty">
                  When off, scans are still decoded and shown but nothing is written to your device.
                </p>
              </div>
              <Switch
                id="history-enabled"
                :model-value="settings.historyEnabled"
                @update:model-value="(value) => setHistoryEnabled(value === true)"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">Export default</CardTitle>
            <CardDescription>Pre-selected download format for new QR codes.</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-2">
            <div class="flex flex-wrap gap-2" role="group" aria-label="Default export format">
              <Button
                v-for="format in EXPORT_FORMATS"
                :key="format.value"
                variant="outline"
                :aria-pressed="settings.defaultExport === format.value"
                :class="settings.defaultExport === format.value ? 'border-primary/40 bg-primary/5' : undefined"
                @click="updateSettings({ defaultExport: format.value })"
              >
                {{ format.label }}
              </Button>
            </div>
            <p class="text-muted-foreground text-xs">
              {{ EXPORT_FORMATS.find((format) => format.value === settings.defaultExport)?.hint }}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">Default style</CardTitle>
            <CardDescription>
              Every new QR code starts from these settings. Existing codes keep their own style.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QrCustomizer
              :style="settings.defaultStyle"
              :default-style="factoryStyle"
              reset-label="Reset default style to factory settings"
              @change="updateDefaultStyle"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">Stored data</CardTitle>
            <CardDescription>
              {{ storedSummary.codes }} saved {{ storedSummary.codes === 1 ? 'code' : 'codes' }} and
              {{ storedSummary.entries }} history {{ storedSummary.entries === 1 ? 'entry' : 'entries' }}
              in this browser.
            </CardDescription>
          </CardHeader>
          <CardContent class="grid gap-4">
            <div class="flex items-start gap-3 rounded-lg border p-3">
              <span
                class="grid size-9 shrink-0 place-items-center rounded-lg"
                :class="
                  persistenceState === 'granted'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                "
                aria-hidden="true"
              >
                <ShieldCheckIcon class="size-4" />
              </span>
              <div class="grid min-w-0 gap-0.5">
                <p class="text-sm font-medium">{{ persistenceCopy.title }}</p>
                <p class="text-muted-foreground text-xs text-pretty">{{ persistenceCopy.detail }}</p>
              </div>
              <Button
                v-if="persistenceState === 'denied'"
                variant="outline"
                size="sm"
                class="ml-auto shrink-0"
                @click="requestPersistence"
              >
                Protect
              </Button>
            </div>

            <div class="flex flex-wrap gap-2">
              <Button
                variant="outline"
                :disabled="storedSummary.codes === 0"
                @click="requestAction('codes')"
              >
                <Trash2Icon />
                Delete saved codes
              </Button>
              <Button
                variant="outline"
                :disabled="storedSummary.entries === 0"
                @click="requestAction('history')"
              >
                <Trash2Icon />
                Clear scan history
              </Button>
              <Button
                variant="outline"
                class="text-destructive hover:bg-destructive/10"
                @click="requestAction('everything')"
              >
                <DatabaseIcon />
                Erase everything
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <ShieldCheckIcon class="size-4" aria-hidden="true" />
              Privacy &amp; security
            </CardTitle>
          </CardHeader>
          <CardContent class="grid gap-3 text-sm">
            <p class="text-muted-foreground text-pretty">
              SweetQR has no server and no account. Saved codes, logos, settings and scan history live
              in this browser's local storage, and camera frames and uploaded images are decoded on
              this device.
            </p>
            <p class="text-muted-foreground text-pretty">
              Clearing your browser data — or using the buttons above — removes everything, and it
              cannot be recovered.
            </p>
            <p class="text-muted-foreground text-pretty">
              Scanned links are never opened automatically. Codes using
              <code class="font-mono text-xs">javascript:</code>,
              <code class="font-mono text-xs">data:</code> or
              <code class="font-mono text-xs">file:</code> schemes are flagged as unsafe and only
              offered as copyable text.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <InfoIcon class="size-4" aria-hidden="true" />
              About
            </CardTitle>
            <CardDescription>
              SweetQR — a local-first QR toolkit. Install it from your browser menu to use it offline.
            </CardDescription>
          </CardHeader>
          <CardContent class="text-muted-foreground grid gap-2 text-xs">
            <p>The camera needs a secure connection: HTTPS, or localhost during development.</p>
            <p>Torch control depends on your device and browser; it is hidden when unsupported.</p>
          </CardContent>
        </Card>
      </div>

      <template #fallback>
        <div class="grid gap-4">
          <Skeleton class="h-28 w-full" />
          <Skeleton class="h-28 w-full" />
        </div>
      </template>
    </ClientOnly>

    <AlertDialog :open="confirmDialogOpen" @update:open="(open) => (confirmDialogOpen = open)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ confirmCopy.title }}</AlertDialogTitle>
          <AlertDialogDescription>{{ confirmCopy.description }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive/10 text-destructive hover:bg-destructive/20"
            @click="runConfirmedAction"
          >
            {{ confirmCopy.action }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
