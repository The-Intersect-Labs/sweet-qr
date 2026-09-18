import type { AppSettings, QrFormData, QrStyleState, SavedQrCode, ScanHistoryEntry } from '~/types'
import { MAX_SCAN_HISTORY } from '~/types'
import { isQrTypeId } from '~/lib/qr/registry'

export const STORAGE_KEYS = {
  saved: 'sweetqr:saved-codes',
  history: 'sweetqr:scan-history',
  settings: 'sweetqr:settings',
  draft: 'sweetqr:generator-draft',
} as const

export const SCHEMA_VERSION = 1

export function createDefaultStyle(): QrStyleState {
  return {
    fgColor: '#111114',
    bgColor: '#ffffff',
    fgGradient: null,
    bgGradient: null,
    dotStyle: 'rounded',
    cornerSquareStyle: 'extra-rounded',
    cornerDotStyle: 'dot',
    size: 1024,
    margin: 16,
    errorCorrection: 'Q',
    logo: null,
    logoSize: 0.35,
    logoMargin: 8,
  }
}

export function createDefaultSettings(): AppSettings {
  return {
    version: SCHEMA_VERSION,
    historyEnabled: true,
    defaultExport: 'png',
    defaultStyle: createDefaultStyle(),
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function asIsoString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  return Number.isNaN(new Date(value).getTime()) ? fallback : value
}

export function normalizeStyle(value: unknown): QrStyleState {
  const base = createDefaultStyle()
  const record = asRecord(value)
  if (!record) return base
  return { ...base, ...(record as Partial<QrStyleState>) }
}

/**
 * Reads are deliberately forgiving: an older or hand-edited payload is repaired onto
 * current defaults rather than throwing and blanking the user's library.
 */
export function normalizeSavedQrCode(value: unknown): SavedQrCode | null {
  const record = asRecord(value)
  if (!record) return null
  if (typeof record.id !== 'string' || typeof record.payload !== 'string') return null

  const now = new Date().toISOString()
  const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : 'Untitled QR code'

  return {
    id: record.id,
    name,
    type: isQrTypeId(record.type) ? record.type : 'text',
    payload: record.payload,
    form: (asRecord(record.form) as QrFormData | null) ?? {},
    style: normalizeStyle(record.style),
    favorite: record.favorite === true,
    createdAt: asIsoString(record.createdAt, now),
    updatedAt: asIsoString(record.updatedAt, now),
  }
}

export function normalizeScanHistory(value: unknown): ScanHistoryEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry): ScanHistoryEntry | null => {
      const record = asRecord(entry)
      if (!record || typeof record.id !== 'string' || typeof record.raw !== 'string') return null
      return {
        id: record.id,
        raw: record.raw,
        type: isQrTypeId(record.type) ? record.type : 'text',
        label: typeof record.label === 'string' ? record.label : '',
        scannedAt: asIsoString(record.scannedAt, new Date().toISOString()),
      }
    })
    .filter((entry): entry is ScanHistoryEntry => entry !== null)
    .slice(0, MAX_SCAN_HISTORY)
}

export function mergeSavedCodes(value: unknown): SavedQrCode[] {
  if (!Array.isArray(value)) return []
  return value
    .map(normalizeSavedQrCode)
    .filter((entry): entry is SavedQrCode => entry !== null)
}

export function mergeSettings(value: unknown): AppSettings {
  const base = createDefaultSettings()
  const record = asRecord(value)
  if (!record) return base
  return {
    ...base,
    historyEnabled: record.historyEnabled !== false,
    defaultExport: record.defaultExport === 'svg' ? 'svg' : 'png',
    version: SCHEMA_VERSION,
    defaultStyle: normalizeStyle(record.defaultStyle),
  }
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
