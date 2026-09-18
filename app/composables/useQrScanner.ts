import type jsQRType from 'jsqr'

export type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'error'

export interface ScannerDevice {
  deviceId: string
  label: string
}

export interface ScannerError {
  message: string
  hint: string
}

/** How often to attempt a decode. Scanning every frame is needless battery drain. */
const SCAN_INTERVAL_MS = 120
/** Decode width cap — big frames cost far more than they help. */
const DECODE_MAX_WIDTH = 640

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean }

function mapCameraError(error: unknown): ScannerError {
  switch ((error as DOMException | undefined)?.name) {
    case 'NotAllowedError':
      return {
        message: 'Camera access was blocked.',
        hint: 'Allow camera access for this site in your browser settings, then try again.',
      }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        message: 'No camera was found.',
        hint: 'Connect a camera, or use the Upload tab to scan an image instead.',
      }
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        message: 'The camera is unavailable.',
        hint: 'Another app may be using it. Close other apps that use the camera and try again.',
      }
    case 'OverconstrainedError':
      return {
        message: 'That camera could not be used.',
        hint: 'Try selecting a different camera from the list.',
      }
    default:
      return {
        message: 'The camera could not be started.',
        hint: 'Check your browser permissions, then try again.',
      }
  }
}

/**
 * Camera QR scanner built on getUserMedia + jsQR.
 *
 * Deliberately does not auto-start: starting a camera should be an explicit user
 * action so no permission prompt appears without intent.
 */
export function useQrScanner(onResult: (raw: string) => void) {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const status = ref<ScannerStatus>('idle')
  const error = ref<ScannerError | null>(null)
  const devices = ref<ScannerDevice[]>([])
  const activeDeviceId = ref<string | null>(null)
  const torchSupported = ref(false)
  const torchOn = ref(false)

  let stream: MediaStream | null = null
  let frameRequest: number | null = null
  let lastScanAt = 0
  let canvas: HTMLCanvasElement | null = null
  let detector: typeof jsQRType | null = null

  async function ensureDetector() {
    if (!detector) {
      const module = await import('jsqr')
      detector = module.default
    }
    return detector
  }

  async function refreshDevices() {
    const available = await navigator.mediaDevices.enumerateDevices()
    devices.value = available
      .filter((device) => device.kind === 'videoinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`,
      }))
  }

  function tick(now: number) {
    frameRequest = requestAnimationFrame(tick)

    const video = videoRef.value
    if (!video || video.readyState < 2 || !detector) return
    if (now - lastScanAt < SCAN_INTERVAL_MS) return
    lastScanAt = now

    const width = video.videoWidth
    const height = video.videoHeight
    if (!width || !height) return

    const scale = Math.min(1, DECODE_MAX_WIDTH / width)
    const decodeWidth = Math.max(1, Math.round(width * scale))
    const decodeHeight = Math.max(1, Math.round(height * scale))

    canvas ??= document.createElement('canvas')
    canvas.width = decodeWidth
    canvas.height = decodeHeight

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return

    context.drawImage(video, 0, 0, decodeWidth, decodeHeight)
    const frame = context.getImageData(0, 0, decodeWidth, decodeHeight)

    // Camera frames are never inverted; skipping inversion keeps this fast.
    const found = detector(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' })
    if (found?.data) {
      stop()
      onResult(found.data)
    }
  }

  function stop() {
    if (frameRequest !== null) {
      cancelAnimationFrame(frameRequest)
      frameRequest = null
    }
    if (stream) {
      for (const track of stream.getTracks()) track.stop()
      stream = null
    }
    if (videoRef.value) videoRef.value.srcObject = null
    torchOn.value = false
    torchSupported.value = false
    if (status.value === 'scanning' || status.value === 'starting') status.value = 'idle'
  }

  async function start(deviceId?: string) {
    stop()
    error.value = null

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      error.value = {
        message: 'This browser cannot access the camera.',
        hint: 'Use the Upload tab to scan an image instead.',
      }
      status.value = 'error'
      return
    }

    if (!window.isSecureContext) {
      error.value = {
        message: 'Camera access needs a secure connection.',
        hint: 'Open SweetQR over HTTPS, or on localhost, to use the camera.',
      }
      status.value = 'error'
      return
    }

    status.value = 'starting'
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })

      const video = videoRef.value
      if (video) {
        video.srcObject = stream
        await video.play().catch(() => undefined)
      }

      await refreshDevices()

      const track = stream.getVideoTracks()[0]
      activeDeviceId.value = track?.getSettings().deviceId ?? deviceId ?? null
      torchSupported.value = Boolean((track?.getCapabilities() as TorchCapabilities | undefined)?.torch)

      await ensureDetector()
      lastScanAt = 0
      status.value = 'scanning'
      frameRequest = requestAnimationFrame(tick)
    } catch (caught) {
      error.value = mapCameraError(caught)
      status.value = 'error'
      stop()
    }
  }

  async function switchCamera(deviceId: string) {
    if (deviceId === activeDeviceId.value) return
    await start(deviceId)
  }

  async function toggleTorch() {
    const track = stream?.getVideoTracks()[0]
    if (!track || !torchSupported.value) return

    const next = !torchOn.value
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] })
      torchOn.value = next
    } catch {
      // Not every device that advertises torch accepts the constraint.
      torchSupported.value = false
      torchOn.value = false
    }
  }

  onBeforeUnmount(stop)

  return {
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
  }
}
