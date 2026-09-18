export type QrTypeId = 'url' | 'text' | 'wifi' | 'vcard' | 'email' | 'phone' | 'sms' | 'location'

export type QrFormValue = string | boolean
export type QrFormData = Record<string, QrFormValue>

export type DotStyle = 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded'
export type CornerSquareStyle = 'square' | 'dot' | 'extra-rounded'
export type CornerDotStyle = 'dot' | 'square'
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'
export type GradientType = 'linear' | 'radial'
export type ExportFormat = 'png' | 'svg'

export interface QrGradientStop {
  offset: number
  color: string
}

export interface QrGradient {
  type: GradientType
  /** Degrees. Converted to radians when handed to the QR renderer. */
  rotation: number
  colorStops: QrGradientStop[]
}

export interface QrStyleState {
  fgColor: string
  bgColor: string
  fgGradient: QrGradient | null
  bgGradient: QrGradient | null
  dotStyle: DotStyle
  cornerSquareStyle: CornerSquareStyle
  cornerDotStyle: CornerDotStyle
  /** Export resolution in pixels. The preview always renders at its own fixed resolution. */
  size: number
  margin: number
  errorCorrection: ErrorCorrectionLevel
  /** Downscaled data URL, never an external URL, so canvas export stays untainted. */
  logo: string | null
  logoSize: number
  logoMargin: number
}

export interface SavedQrCode {
  id: string
  name: string
  type: QrTypeId
  payload: string
  form: QrFormData
  style: QrStyleState
  favorite: boolean
  createdAt: string
  updatedAt: string
}

export interface ScanHistoryEntry {
  id: string
  raw: string
  type: QrTypeId
  label: string
  scannedAt: string
}

export interface AppSettings {
  version: number
  historyEnabled: boolean
  defaultExport: ExportFormat
  defaultStyle: QrStyleState
}

export interface ScanResultField {
  label: string
  value: string
  /** Masked behind a reveal toggle in the UI (Wi-Fi passwords). */
  sensitive?: boolean
}

export interface ScanAction {
  label: string
  kind: 'copy' | 'open' | 'download'
  /** Text to copy, href to open, or file contents to download. */
  value: string
  primary?: boolean
  icon?: 'copy' | 'external' | 'download'
  mime?: string
  filename?: string
}

export interface ScanResult {
  raw: string
  type: QrTypeId
  /** Short human summary: a hostname, SSID, contact name, phone number… */
  label: string
  fields: ScanResultField[]
  actions: ScanAction[]
  /** True when the payload uses a scheme we refuse to act on (javascript:, data:…). */
  unsafe: boolean
}

export const QR_STYLE_LIMITS = {
  size: { min: 128, max: 2048, step: 8 },
  margin: { min: 0, max: 64, step: 1 },
  logoSize: { min: 0.1, max: 0.5, step: 0.01 },
  logoMargin: { min: 0, max: 32, step: 1 },
} as const

export const MAX_LOGO_DIMENSION = 256
export const MAX_LOGO_FILE_BYTES = 5 * 1024 * 1024
export const MAX_SCAN_HISTORY = 200
