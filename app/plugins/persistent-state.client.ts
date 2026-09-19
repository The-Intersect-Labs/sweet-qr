import { toast } from 'vue-sonner'
import type { Ref } from 'vue'
import type { AppSettings, SavedQrCode, ScanHistoryEntry } from '~/types'
import {
  STORAGE_KEYS,
  createDefaultSettings,
  mergeSavedCodes,
  mergeSettings,
  normalizeScanHistory,
} from '~/lib/storage'

/**
 * Owns every localStorage-backed collection.
 *
 * Wiring lives here (a client plugin) rather than inside the composables so the
 * watchers are app-scoped: a composable-scoped watcher would stop persisting as soon
 * as the component that first called it unmounted.
 */

let registered = false
let storageWarningShown = false

function notifyStorageFailure() {
  if (storageWarningShown) return
  storageWarningShown = true
  toast.error('Browser storage is full', {
    description: 'Delete a saved QR code or remove a logo to free up space. Recent changes may not be saved.',
    duration: 10_000,
  })
}

function persistentState<T>(key: string, fallback: () => T, normalize: (value: unknown) => T): Ref<T> {
  const state = useState<T>(key, fallback)

  // Read synchronously so data is present before the first client render.
  try {
    const raw = window.localStorage.getItem(key)
    if (raw !== null) state.value = normalize(JSON.parse(raw))
  } catch {
    // Unreadable or corrupt entry: keep in-memory defaults.
  }

  watch(
    state,
    (value) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch {
        notifyStorageFailure()
      }
    },
    { deep: true },
  )

  return state
}

export default defineNuxtPlugin(() => {
  if (registered) return
  registered = true

  const savedCodes = persistentState<SavedQrCode[]>(STORAGE_KEYS.saved, () => [], mergeSavedCodes)
  persistentState<AppSettings>(STORAGE_KEYS.settings, createDefaultSettings, mergeSettings)
  persistentState<ScanHistoryEntry[]>(STORAGE_KEYS.history, () => [], normalizeScanHistory)

  // Ask the browser to protect this origin's storage from automatic eviction. Only worth
  // asking once there is a library to lose, and never blocking app start on it.
  const { requestIfNeeded } = useStoragePersistence()
  void requestIfNeeded(savedCodes.value.length > 0)
})
