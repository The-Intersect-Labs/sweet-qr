import type { QrStyleState, ExportFormat } from '~/types'
import { slugify } from '~/lib/format'
import { downloadBlob } from '~/lib/download'
import { buildQrOptions } from './useQrRenderOptions'

export function useQrExport() {
  const exporting = ref<ExportFormat | null>(null)

  /**
   * Renders a throwaway instance at the export resolution rather than mutating the
   * preview instance, so exporting never disturbs what is on screen.
   */
  async function exportQr(payload: string, style: QrStyleState, format: ExportFormat, name: string) {
    if (!payload) return

    exporting.value = format
    try {
      const { default: QRCodeStyling } = await import('qr-code-styling')
      const instance = new QRCodeStyling(
        buildQrOptions({
          payload,
          style,
          resolution: style.size,
          elementType: format === 'png' ? 'canvas' : 'svg',
        }),
      )

      const data = (await instance.getRawData(format)) as Blob
      downloadBlob(data, `${slugify(name)}-${style.size}.${format}`)
    } finally {
      exporting.value = null
    }
  }

  return { exportQr, exporting }
}
