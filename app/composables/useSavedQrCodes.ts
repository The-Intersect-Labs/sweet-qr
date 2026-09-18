import type { QrFormData, QrStyleState, QrTypeId, SavedQrCode } from '~/types'
import { STORAGE_KEYS, createId } from '~/lib/storage'
import { getQrTypeDef } from '~/lib/qr/registry'

export interface SaveQrInput {
  id?: string
  name: string
  type: QrTypeId
  payload: string
  form: QrFormData
  style: QrStyleState
  favorite?: boolean
}

export function useSavedQrCodes() {
  const codes = useState<SavedQrCode[]>(STORAGE_KEYS.saved, () => [])

  function get(id: string): SavedQrCode | undefined {
    return codes.value.find((code) => code.id === id)
  }

  function save(input: SaveQrInput): SavedQrCode {
    const now = new Date().toISOString()
    const existing = input.id ? get(input.id) : undefined

    if (existing) {
      const updated: SavedQrCode = {
        ...existing,
        name: input.name,
        type: input.type,
        payload: input.payload,
        form: input.form,
        style: input.style,
        favorite: input.favorite ?? existing.favorite,
        updatedAt: now,
      }
      codes.value = codes.value.map((code) => (code.id === updated.id ? updated : code))
      return updated
    }

    const created: SavedQrCode = {
      id: createId(),
      name: input.name,
      type: input.type,
      payload: input.payload,
      form: input.form,
      style: input.style,
      favorite: input.favorite ?? false,
      createdAt: now,
      updatedAt: now,
    }
    codes.value = [created, ...codes.value]
    return created
  }

  function remove(id: string) {
    codes.value = codes.value.filter((code) => code.id !== id)
  }

  function rename(id: string, name: string) {
    const trimmed = name.trim() || 'Untitled QR code'
    const now = new Date().toISOString()
    codes.value = codes.value.map((code) =>
      code.id === id ? { ...code, name: trimmed, updatedAt: now } : code,
    )
    return trimmed
  }

  function toggleFavorite(id: string) {
    codes.value = codes.value.map((code) =>
      code.id === id ? { ...code, favorite: !code.favorite } : code,
    )
  }

  function duplicate(id: string): SavedQrCode | undefined {
    const source = get(id)
    if (!source) return undefined

    const now = new Date().toISOString()
    const copy: SavedQrCode = {
      ...source,
      id: createId(),
      name: `${source.name} (copy)`,
      favorite: false,
      createdAt: now,
      updatedAt: now,
      form: { ...source.form },
      style: { ...source.style },
    }
    codes.value = [copy, ...codes.value]
    return copy
  }

  function clear() {
    codes.value = []
  }

  /** Used by the generator to suggest a sensible default name. */
  function suggestName(type: QrTypeId, form: QrFormData, payload: string): string {
    const def = getQrTypeDef(type)
    const candidates = [
      form.ssid,
      form.firstName,
      form.address,
      form.label,
      form.subject,
      form.organization,
    ]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return `${def.label}: ${candidate.trim()}`.slice(0, 80)
      }
    }
    if (type === 'url' || type === 'text') {
      const trimmed = payload.trim()
      if (trimmed) return trimmed.slice(0, 60)
    }
    return `${def.label} code`
  }

  return { codes, get, save, remove, rename, toggleFavorite, duplicate, clear, suggestName }
}
