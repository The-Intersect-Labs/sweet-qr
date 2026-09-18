<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useMediaQuery, usePreferredReducedMotion } from '@vueuse/core'
import { CameraIcon, HistoryIcon, ImageIcon, InfoIcon, ScanLineIcon } from '@lucide/vue'
import type { ScanResult } from '~/types'
import { parseQrPayload } from '~/lib/qr/parse'
import { useScanHistory } from '~/composables/useScanHistory'

useSeoMeta({ title: 'Scanner · SweetQR' })

const { record, historyEnabled } = useScanHistory()

const tab = ref<'camera' | 'upload'>('camera')
const result = ref<ScanResult | null>(null)
const resultPanel = ref<HTMLElement | null>(null)

/** Matches the `lg` breakpoint, below which the results sit under the scanner. */
const isStackedLayout = useMediaQuery('(max-width: 1023px)')
const reducedMotion = usePreferredReducedMotion()

/**
 * On narrow screens the result lands below the fold, so bring it into view. Skipped on
 * wide screens (where it is already beside the scanner), when it is already visible, and
 * for users who asked for reduced motion.
 */
async function revealResult() {
  if (!isStackedLayout.value) return

  // The card is rendered by v-if, so wait for it to be in the DOM.
  await nextTick()

  const element = resultPanel.value
  if (!element) return

  const { top } = element.getBoundingClientRect()
  if (top >= 0 && top < window.innerHeight * 0.4) return

  element.scrollIntoView({
    behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth',
    block: 'start',
  })
}

function onScan(raw: string) {
  const parsed = parseQrPayload(raw)
  result.value = parsed

  const saved = record(parsed)
  toast.success('Scanned', {
    description: saved?.label ?? 'History is off, so this was not saved.',
  })

  void revealResult()
}

function scanAgain() {
  result.value = null
}

function saveAsQrCode() {
  if (!result.value) return
  void navigateTo({ path: '/generator', query: { from: result.value.raw } })
}
</script>

<template>
  <div>
    <PageHeader title="Scanner" description="Scan with your camera or read a QR code from an image.">
      <template #actions>
        <Button as-child variant="outline" size="sm">
          <NuxtLink to="/history">
            <HistoryIcon />
            Scan history
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <div class="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardContent class="pt-6">
          <Tabs v-model="tab">
            <TabsList class="mb-4 w-full">
              <TabsTrigger value="camera">
                <CameraIcon />
                Camera
              </TabsTrigger>
              <TabsTrigger value="upload">
                <ImageIcon />
                Upload image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera">
              <CameraScanner @scan="onScan" />
            </TabsContent>
            <TabsContent value="upload">
              <UploadScanner @scan="onScan" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <!-- scroll-mt clears the sticky header when we scroll this into view -->
      <div ref="resultPanel" class="grid scroll-mt-20 gap-4">
        <Card v-if="result">
          <CardContent class="grid gap-4 pt-6">
            <ScanResult :result="result" />

            <Separator />

            <div class="flex flex-wrap gap-2">
              <Button @click="scanAgain">
                <ScanLineIcon />
                Scan another
              </Button>
              <Button variant="outline" @click="saveAsQrCode">Save as a QR code</Button>
            </div>

            <p class="text-muted-foreground text-xs">
              <template v-if="historyEnabled">Saved to your scan history.</template>
              <template v-else>
                History is off, so this scan was not saved.
                <NuxtLink to="/settings" class="text-primary underline underline-offset-4">
                  Turn it on
                </NuxtLink>.
              </template>
            </p>
          </CardContent>
        </Card>

        <EmptyState
          v-else
          :icon="ScanLineIcon"
          title="Nothing scanned yet"
          description="Results appear here. SweetQR never opens a scanned link on its own — you choose what to do with it."
        />

        <div class="text-muted-foreground flex items-start gap-2 rounded-xl border p-3 text-xs">
          <InfoIcon class="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <p>
            Scanning happens entirely on this device. Camera frames and uploaded images are never
            sent anywhere.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
