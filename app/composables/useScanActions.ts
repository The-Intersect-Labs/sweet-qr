import { toast } from 'vue-sonner'
import { useClipboard } from '@vueuse/core'
import type { ScanAction } from '~/types'
import { downloadText } from '~/lib/download'
import { truncate } from '~/lib/format'

/**
 * Runs a declarative scan action. Shared by the scan result panel and history rows so
 * copy/open/download behaviour is defined exactly once.
 */
export function useScanActions() {
  const { copy, isSupported } = useClipboard({ copiedDuring: 1600 })

  function run(action: ScanAction) {
    if (action.kind === 'copy') {
      if (!isSupported.value) {
        toast.error('Clipboard unavailable', { description: 'Copying is blocked in this browser context.' })
        return
      }
      copy(action.value)
      return
    }

    if (action.kind === 'open') {
      // Only ever called from an explicit user click — never automatically.
      window.open(action.value, '_blank', 'noopener,noreferrer')
      return
    }

    downloadText(action.value, action.filename ?? 'sweetqr-export.txt', action.mime ?? 'text/plain')
    toast.success('Downloaded', { description: truncate(action.filename ?? action.value, 40) })
  }

  return { run }
}
