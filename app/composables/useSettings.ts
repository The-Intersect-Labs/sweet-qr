import type { AppSettings, QrStyleState } from '~/types'
import { STORAGE_KEYS, createDefaultSettings, createDefaultStyle } from '~/lib/storage'

export function useSettings() {
  const settings = useState<AppSettings>(STORAGE_KEYS.settings, createDefaultSettings)

  function updateSettings(patch: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...patch }
  }

  function updateDefaultStyle(patch: Partial<QrStyleState>) {
    settings.value = { ...settings.value, defaultStyle: { ...settings.value.defaultStyle, ...patch } }
  }

  function resetDefaultStyle() {
    settings.value = { ...settings.value, defaultStyle: createDefaultStyle() }
  }

  const historyEnabled = computed(() => settings.value.historyEnabled)

  function setHistoryEnabled(enabled: boolean) {
    updateSettings({ historyEnabled: enabled })
  }

  return {
    settings,
    historyEnabled,
    updateSettings,
    updateDefaultStyle,
    resetDefaultStyle,
    setHistoryEnabled,
  }
}
