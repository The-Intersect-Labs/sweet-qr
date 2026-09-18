<script setup lang="ts">
import { CameraIcon, FlashlightIcon, Loader2Icon, RefreshCwIcon, SwitchCameraIcon, XIcon } from '@lucide/vue'

const emit = defineEmits<{ scan: [raw: string] }>()

const {
  videoRef,
  status,
  error,
  devices,
  activeDeviceId,
  torchSupported,
  torchOn,
  start,
  stop,
  switchCamera,
  toggleTorch,
} = useQrScanner((raw) => emit('scan', raw))
</script>

<template>
  <div class="grid gap-3">
    <div
      class="bg-muted/30 relative aspect-square w-full overflow-hidden rounded-2xl border sm:aspect-video"
    >
      <video
        ref="videoRef"
        class="size-full object-cover"
        playsinline
        muted
        :class="status === 'scanning' ? 'opacity-100' : 'opacity-0'"
        aria-hidden="true"
      />

      <!-- Scan frame overlay -->
      <div
        v-if="status === 'scanning'"
        class="pointer-events-none absolute inset-0 grid place-items-center"
        aria-hidden="true"
      >
        <div class="relative aspect-square w-[68%] max-w-72">
          <span class="border-primary absolute top-0 left-0 size-6 rounded-tl-lg border-t-2 border-l-2" />
          <span class="border-primary absolute top-0 right-0 size-6 rounded-tr-lg border-t-2 border-r-2" />
          <span class="border-primary absolute bottom-0 left-0 size-6 rounded-bl-lg border-b-2 border-l-2" />
          <span class="border-primary absolute right-0 bottom-0 size-6 rounded-br-lg border-r-2 border-b-2" />
          <span class="qr-scan-beam bg-primary/60 absolute inset-x-2 h-0.5 rounded-full" />
        </div>
      </div>

      <div
        v-if="status === 'idle' || status === 'starting'"
        class="absolute inset-0 grid place-items-center p-6 text-center"
      >
        <div class="grid justify-items-center gap-3">
          <span class="bg-muted text-muted-foreground grid size-11 place-items-center rounded-xl">
            <CameraIcon class="size-5" />
          </span>
          <p class="text-muted-foreground max-w-xs text-sm text-pretty">
            The camera only turns on when you ask it to. Point it at a QR code and the result appears
            below — nothing opens on its own.
          </p>
        </div>
      </div>

      <div v-if="status === 'error' && error" class="absolute inset-0 grid place-items-center p-6 text-center">
        <div class="grid justify-items-center gap-2">
          <p class="text-sm font-medium">{{ error.message }}</p>
          <p class="text-muted-foreground max-w-xs text-xs text-pretty">{{ error.hint }}</p>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Button v-if="status === 'idle' || status === 'error'" @click="start()">
        <CameraIcon />
        Start camera
      </Button>

      <Button v-else-if="status === 'starting'" disabled>
        <Loader2Icon class="animate-spin" />
        Starting…
      </Button>

      <template v-else>
        <Button variant="outline" @click="stop">
          <XIcon />
          Stop camera
        </Button>

        <Button
          v-if="torchSupported"
          variant="outline"
          :aria-pressed="torchOn"
          @click="toggleTorch"
        >
          <FlashlightIcon />
          {{ torchOn ? 'Torch on' : 'Torch' }}
        </Button>

        <div v-if="devices.length > 1" class="flex items-center gap-2">
          <SwitchCameraIcon class="text-muted-foreground size-4" aria-hidden="true" />
          <Select
            :model-value="activeDeviceId ?? undefined"
            @update:model-value="(value) => typeof value === 'string' && switchCamera(value)"
          >
            <SelectTrigger class="w-52" aria-label="Choose camera">
              <SelectValue placeholder="Choose camera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="device in devices" :key="device.deviceId" :value="device.deviceId">
                {{ device.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </template>

      <Button v-if="status === 'error'" variant="ghost" @click="start()">
        <RefreshCwIcon />
        Try again
      </Button>
    </div>
  </div>
</template>
