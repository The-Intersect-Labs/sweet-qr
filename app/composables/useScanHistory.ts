import type { ScanHistoryEntry, ScanResult } from '~/types'
import { MAX_SCAN_HISTORY } from '~/types'
import { STORAGE_KEYS, createId } from '~/lib/storage'
import { useSettings } from './useSettings'

export function useScanHistory() {
  const { settings } = useSettings()
  const entries = useState<ScanHistoryEntry[]>(STORAGE_KEYS.history, () => [])

  /** Newest first. Silently no-ops when the user has turned history off. */
  function record(result: ScanResult): ScanHistoryEntry | undefined {
    if (!settings.value.historyEnabled) return undefined

    const entry: ScanHistoryEntry = {
      id: createId(),
      raw: result.raw,
      type: result.type,
      label: result.label,
      scannedAt: new Date().toISOString(),
    }
    entries.value = [entry, ...entries.value].slice(0, MAX_SCAN_HISTORY)
    return entry
  }

  function remove(id: string) {
    entries.value = entries.value.filter((entry) => entry.id !== id)
  }

  function clear() {
    entries.value = []
  }

  return { entries, record, remove, clear, historyEnabled: computed(() => settings.value.historyEnabled) }
}
