<script setup lang="ts">
import {
  ArrowRightIcon,
  CameraIcon,
  HistoryIcon,
  PlusIcon,
  QrCodeIcon,
  ScanLineIcon,
  SparklesIcon,
  StarIcon,
} from '@lucide/vue'
import { getQrTypeDef } from '~/lib/qr/registry'
import { formatRelativeTime, truncate } from '~/lib/format'

useSeoMeta({ title: 'Dashboard · SweetQR' })

const { codes } = useSavedQrCodes()
const { entries } = useScanHistory()

const favouriteCount = computed(() => codes.value.filter((code) => code.favorite).length)

const recentCodes = computed(() =>
  [...codes.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4),
)

const recentScans = computed(() => entries.value.slice(0, 4))

const isNewUser = computed(() => codes.value.length === 0 && entries.value.length === 0)

const stats = computed(() => [
  { label: 'Saved codes', value: codes.value.length, icon: QrCodeIcon, to: '/codes' },
  { label: 'Favourites', value: favouriteCount.value, icon: StarIcon, to: '/codes' },
  { label: 'Scans recorded', value: entries.value.length, icon: HistoryIcon, to: '/history' },
])
</script>

<template>
  <div>
    <PageHeader title="Dashboard" description="Your QR codes and scans at a glance.">
      <template #actions>
        <Button as-child variant="outline" size="sm">
          <NuxtLink to="/scanner">
            <CameraIcon />
            Scan
          </NuxtLink>
        </Button>
        <Button as-child size="sm">
          <NuxtLink to="/generator">
            <PlusIcon />
            New QR code
          </NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <ClientOnly>
      <!-- Onboarding for a brand new install -->
      <Card v-if="isNewUser" class="mb-5">
        <CardContent class="grid gap-4 pt-6">
          <div class="flex items-start gap-3">
            <span class="from-primary to-chart-2 grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white">
              <SparklesIcon class="size-5" aria-hidden="true" />
            </span>
            <div class="grid gap-1">
              <h2 class="text-base font-semibold tracking-tight">Welcome to SweetQR</h2>
              <p class="text-muted-foreground text-sm text-pretty">
                Create QR codes for links, Wi-Fi, contacts and more, style them, then download or
                print. Scan codes with your camera or from an image. Everything stays in this
                browser — there is no account and nothing is uploaded.
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button as-child>
              <NuxtLink to="/generator">
                <PlusIcon />
                Create your first code
              </NuxtLink>
            </Button>
            <Button as-child variant="outline">
              <NuxtLink to="/scanner">
                <ScanLineIcon />
                Scan a code
              </NuxtLink>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-5">
        <div class="grid gap-3 sm:grid-cols-3">
          <NuxtLink
            v-for="stat in stats"
            :key="stat.label"
            :to="stat.to"
            class="focus-visible:ring-ring/50 rounded-xl outline-none focus-visible:ring-3"
          >
            <Card class="hover:bg-muted/40 h-full transition-colors">
              <CardContent class="flex items-center gap-3 pt-6">
                <span class="bg-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-lg">
                  <component :is="stat.icon" class="size-4" aria-hidden="true" />
                </span>
                <div class="grid">
                  <span class="text-2xl leading-none font-semibold tabular-nums">{{ stat.value }}</span>
                  <span class="text-muted-foreground text-xs">{{ stat.label }}</span>
                </div>
              </CardContent>
            </Card>
          </NuxtLink>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Recent codes</CardTitle>
              <CardDescription>Your most recently updated saved codes.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                v-if="recentCodes.length === 0"
                :icon="QrCodeIcon"
                title="Nothing saved yet"
                description="Codes you save will appear here."
              >
                <Button as-child variant="outline" size="sm">
                  <NuxtLink to="/generator">Create a code</NuxtLink>
                </Button>
              </EmptyState>

              <div v-else class="grid gap-1">
                <NuxtLink
                  v-for="code in recentCodes"
                  :key="code.id"
                  :to="{ path: '/generator', query: { id: code.id } }"
                  class="hover:bg-muted/50 focus-visible:ring-ring/50 -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 outline-none focus-visible:ring-3"
                >
                  <span class="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg">
                    <component :is="getQrTypeDef(code.type).icon" class="size-3.5" aria-hidden="true" />
                  </span>
                  <span class="grid min-w-0 flex-1">
                    <span class="truncate text-sm font-medium">{{ code.name }}</span>
                    <span class="text-muted-foreground truncate text-xs">
                      {{ truncate(code.payload, 48) }}
                    </span>
                  </span>
                  <StarIcon
                    v-if="code.favorite"
                    class="fill-chart-4 text-chart-4 size-3.5 shrink-0"
                    aria-label="Favourite"
                  />
                </NuxtLink>

                <Button as-child variant="ghost" size="sm" class="mt-1 justify-start">
                  <NuxtLink to="/codes">
                    View all codes
                    <ArrowRightIcon />
                  </NuxtLink>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-base">Recent scans</CardTitle>
              <CardDescription>The latest codes you decoded.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                v-if="recentScans.length === 0"
                :icon="ScanLineIcon"
                title="No scans yet"
                description="Scan a QR code and it will show up here."
              >
                <Button as-child variant="outline" size="sm">
                  <NuxtLink to="/scanner">Open the scanner</NuxtLink>
                </Button>
              </EmptyState>

              <div v-else class="grid gap-1">
                <div
                  v-for="entry in recentScans"
                  :key="entry.id"
                  class="flex items-center gap-3 rounded-lg px-2 py-2"
                >
                  <span class="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg">
                    <component :is="getQrTypeDef(entry.type).icon" class="size-3.5" aria-hidden="true" />
                  </span>
                  <span class="grid min-w-0 flex-1">
                    <span class="truncate text-sm font-medium">{{ entry.label || entry.raw }}</span>
                    <span class="text-muted-foreground text-xs">{{ formatRelativeTime(entry.scannedAt) }}</span>
                  </span>
                </div>

                <Button as-child variant="ghost" size="sm" class="mt-1 justify-start">
                  <NuxtLink to="/history">
                    View scan history
                    <ArrowRightIcon />
                  </NuxtLink>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <template #fallback>
        <div class="grid gap-4">
          <div class="grid gap-3 sm:grid-cols-3">
            <Skeleton class="h-20 w-full" />
            <Skeleton class="h-20 w-full" />
            <Skeleton class="h-20 w-full" />
          </div>
          <Skeleton class="h-56 w-full" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
