import type { QrFormData, QrFormValue } from '~/types'

/**
 * Format codec layer: builds and parses every QR payload format SweetQR supports.
 *
 * Both directions live together on purpose — the generator encodes with the same
 * escaping rules the scanner decodes with, so they can never drift apart.
 */

export function str(value: QrFormValue | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function bool(value: QrFormValue | undefined): boolean {
  return value === true
}

/* ------------------------------------------------------------------ URLs --- */

const SCHEME_WITH_SLASHES = /^[a-z][a-z0-9+.-]*:\/\//i
const ANY_SCHEME = /^\s*([a-z][a-z0-9+.-]*):/i

const UNSAFE_SCHEMES = new Set(['javascript', 'data', 'file', 'blob', 'vbscript'])

/** Adds `https://` when the user typed a bare host, e.g. `example.com/x`. */
export function normalizeUrl(input: string): string {
  const value = input.trim()
  if (!value) return ''
  return SCHEME_WITH_SLASHES.test(value) ? value : `https://${value}`
}

export function isSafeWebUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

export function hostnameOf(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** True for schemes we refuse to navigate to (never auto-opened, and no Open action). */
export function isUnsafeScheme(value: string): boolean {
  const match = ANY_SCHEME.exec(value)
  return match ? UNSAFE_SCHEMES.has(match[1]!.toLowerCase()) : false
}

/** The scheme of a payload, e.g. `javascript` for `javascript:alert(1)`. */
export function schemeOf(value: string): string {
  return ANY_SCHEME.exec(value)?.[1]?.toLowerCase() ?? ''
}

/* ----------------------------------------------------------------- Phone --- */

/** Keeps a leading `+` and digits only, so `tel:` payloads stay dialable. */
export function cleanPhoneNumber(input: string): string {
  const value = input.trim()
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return value.startsWith('+') ? `+${digits}` : digits
}

/* ----------------------------------------------------------------- Wi-Fi --- */

const WIFI_ESCAPE = /([\\;,:"])/g
const WIFI_UNESCAPE = /\\([\\;,:"])/g

export function escapeWifiValue(value: string): string {
  return value.replace(WIFI_ESCAPE, '\\$1')
}

export function unescapeWifiValue(value: string): string {
  return value.replace(WIFI_UNESCAPE, '$1')
}

export interface WifiFields {
  ssid: string
  security: string
  password: string
  identity: string
  hidden: boolean
}

const WIFI_SECURITY_LABELS: Record<string, string> = {
  WPA: 'WPA/WPA2',
  WEP: 'WEP',
  nopass: 'Open network',
  'WPA2-EAP': 'WPA2-Enterprise',
}

export function buildWifiPayload(form: QrFormData): string {
  const security = str(form.security) || 'WPA'
  const parts = [`T:${security}`, `S:${escapeWifiValue(str(form.ssid))}`]
  if (security !== 'nopass' && str(form.password)) {
    parts.push(`P:${escapeWifiValue(str(form.password))}`)
  }
  if (security === 'WPA2-EAP' && str(form.identity)) {
    parts.push(`I:${escapeWifiValue(str(form.identity))}`)
  }
  if (bool(form.hidden)) parts.push('H:true')
  return `WIFI:${parts.join(';')};;`
}

export function parseWifiPayload(raw: string): WifiFields | null {
  if (!/^WIFI:/i.test(raw)) return null
  const body = raw.slice(5)
  const values: Record<string, string> = {}

  // Split on unescaped semicolons.
  let current = ''
  const chunks: string[] = []
  for (let i = 0; i < body.length; i++) {
    const char = body[i]!
    if (char === '\\' && i + 1 < body.length) {
      current += char + body[i + 1]
      i++
      continue
    }
    if (char === ';') {
      chunks.push(current)
      current = ''
      continue
    }
    current += char
  }
  if (current) chunks.push(current)

  for (const chunk of chunks) {
    const separator = chunk.indexOf(':')
    if (separator < 1) continue
    values[chunk.slice(0, separator).toUpperCase()] = chunk.slice(separator + 1)
  }

  const security = values.T || 'nopass'
  return {
    ssid: unescapeWifiValue(values.S ?? ''),
    security,
    password: unescapeWifiValue(values.P ?? ''),
    identity: unescapeWifiValue(values.I ?? ''),
    hidden: (values.H ?? '').toLowerCase() === 'true',
  }
}

export function describeWifiSecurity(security: string): string {
  return WIFI_SECURITY_LABELS[security] ?? security
}

/* ---------------------------------------------------------------- vCard --- */

const VCARD_ESCAPE = /\\/g
const VCARD_ESCAPE_NEWLINE = /\r?\n/g
const VCARD_ESCAPE_COMMA = /,/g
const VCARD_ESCAPE_SEMICOLON = /;/g

export function escapeVCardValue(value: string): string {
  return value
    .replace(VCARD_ESCAPE, '\\\\')
    .replace(VCARD_ESCAPE_NEWLINE, '\\n')
    .replace(VCARD_ESCAPE_COMMA, '\\,')
    .replace(VCARD_ESCAPE_SEMICOLON, '\\;')
}

export function unescapeVCardValue(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

export function buildVCardPayload(form: QrFormData): string {
  const first = str(form.firstName)
  const last = str(form.lastName)
  const org = str(form.organization)
  const email = str(form.email)

  // FN is mandatory in vCard 3.0, so fall back through the best available label.
  const fullName = [first, last].filter(Boolean).join(' ') || org || email || 'Contact'

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardValue(last)};${escapeVCardValue(first)};;;`,
    `FN:${escapeVCardValue(fullName)}`,
  ]

  if (org) lines.push(`ORG:${escapeVCardValue(org)}`)
  if (str(form.title)) lines.push(`TITLE:${escapeVCardValue(str(form.title))}`)
  if (str(form.phone)) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(str(form.phone))}`)
  if (email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(email)}`)
  if (str(form.website)) lines.push(`URL:${escapeVCardValue(str(form.website))}`)

  const address = ['', '', str(form.street), str(form.city), str(form.region), str(form.postalCode), str(form.country)]
  if (address.slice(2).some(Boolean)) {
    lines.push(`ADR;TYPE=WORK:${address.map(escapeVCardValue).join(';')}`)
  }

  if (str(form.note)) lines.push(`NOTE:${escapeVCardValue(str(form.note))}`)
  lines.push('END:VCARD')

  return lines.join('\r\n')
}

/**
 * Splits a structured vCard value (N, ADR) on *unescaped* semicolons, then unescapes
 * each component. Splitting after unescaping would turn an escaped `\;` inside a name
 * into a bogus component separator.
 */
function splitVCardComponents(value: string): string[] {
  const parts: string[] = []
  let current = ''

  for (let i = 0; i < value.length; i++) {
    const char = value[i]!
    if (char === '\\' && i + 1 < value.length) {
      current += char + value[i + 1]
      i++
      continue
    }
    if (char === ';') {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  parts.push(current)

  return parts.map(unescapeVCardValue)
}

/** vCard `N` is Family;Given;Additional;Prefix;Suffix — display order differs. */
function formatVCardName(value: string): string {
  if (!value) return ''
  const [family = '', given = '', additional = '', prefix = '', suffix = ''] = splitVCardComponents(value)
  return [prefix, given, additional, family, suffix]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
}

export interface VCardFields {
  fullName: string
  organization: string
  title: string
  phone: string
  email: string
  website: string
  address: string
  note: string
}

export function parseVCardPayload(raw: string): VCardFields | null {
  if (!/BEGIN:VCARD/i.test(raw)) return null

  const fields: Omit<VCardFields, 'fullName'> = {
    organization: '',
    title: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    note: '',
  }

  let formattedName = ''
  let structuredName = ''
  let rawAddress = ''

  for (const line of raw.split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator < 1) continue
    const property = line.slice(0, separator).split(';')[0]!.toUpperCase()
    const value = line.slice(separator + 1).trim()
    if (!value) continue

    switch (property) {
      case 'FN':
        formattedName ||= unescapeVCardValue(value)
        break
      case 'N':
        structuredName ||= value
        break
      case 'ORG':
        fields.organization ||= unescapeVCardValue(value)
        break
      case 'TITLE':
        fields.title ||= unescapeVCardValue(value)
        break
      case 'TEL':
        fields.phone ||= unescapeVCardValue(value)
        break
      case 'EMAIL':
        fields.email ||= unescapeVCardValue(value)
        break
      case 'URL':
        fields.website ||= unescapeVCardValue(value)
        break
      case 'ADR':
        rawAddress ||= value
        break
      case 'NOTE':
        fields.note ||= unescapeVCardValue(value)
        break
    }
  }

  if (rawAddress) {
    fields.address = splitVCardComponents(rawAddress).filter(Boolean).join(', ')
  }

  // FN is the authoritative display name; only fall back to structured N.
  return { fullName: formattedName || formatVCardName(structuredName), ...fields }
}

/* ------------------------------------------------------- mailto / tel / sms --- */

function encodeQuery(pairs: [string, string][]): string {
  const encoded = pairs
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
  return encoded.length ? `?${encoded.join('&')}` : ''
}

export function buildEmailPayload(form: QrFormData): string {
  const address = str(form.address)
  return `mailto:${address}${encodeQuery([
    ['subject', str(form.subject)],
    ['body', str(form.body)],
  ])}`
}

export interface EmailFields {
  address: string
  subject: string
  body: string
}

export function parseEmailPayload(raw: string): EmailFields | null {
  if (!/^mailto:/i.test(raw)) return null
  const withoutScheme = raw.slice(7)
  const [address = '', query = ''] = withoutScheme.split('?')
  const params = new URLSearchParams(query)
  return {
    address: decodeURIComponent(address),
    subject: params.get('subject') ?? '',
    body: params.get('body') ?? '',
  }
}

export function buildPhonePayload(form: QrFormData): string {
  return `tel:${cleanPhoneNumber(str(form.number))}`
}

export function parsePhonePayload(raw: string): { number: string } | null {
  if (!/^tel:/i.test(raw)) return null
  return { number: raw.slice(4).trim() }
}

export function buildSmsPayload(form: QrFormData): string {
  const number = cleanPhoneNumber(str(form.number))
  const message = str(form.message)
  return `sms:${number}${message ? `?body=${encodeURIComponent(message)}` : ''}`
}

export interface SmsFields {
  number: string
  message: string
}

export function parseSmsPayload(raw: string): SmsFields | null {
  // `sms:` is the registered scheme; `SMSTO:` is the older convention still emitted
  // by many generators, so we read both.
  if (/^SMSTO:/i.test(raw)) {
    const body = raw.slice(6)
    const separator = body.indexOf(':')
    if (separator === -1) return { number: body.trim(), message: '' }
    return { number: body.slice(0, separator).trim(), message: body.slice(separator + 1) }
  }

  if (!/^sms:/i.test(raw)) return null
  const [number = '', query = ''] = raw.slice(4).split('?')
  const params = new URLSearchParams(query)
  return {
    number: decodeURIComponent(number),
    message: params.get('body') ?? params.get('subject') ?? '',
  }
}

/* -------------------------------------------------------------- location --- */

export function buildGeoPayload(form: QrFormData): string {
  const latitude = str(form.latitude)
  const longitude = str(form.longitude)
  const label = str(form.label)
  const coordinates = `${latitude},${longitude}`
  if (!label) return `geo:${coordinates}`
  return `geo:${coordinates}?q=${latitude},${longitude}(${encodeURIComponent(label)})`
}

export interface GeoFields {
  latitude: string
  longitude: string
  label: string
}

export function parseGeoPayload(raw: string): GeoFields | null {
  if (!/^geo:/i.test(raw)) return null
  const withoutScheme = raw.slice(4)
  const [coordinates = '', query = ''] = withoutScheme.split('?')
  const [latitude = '', longitude = ''] = coordinates.split(',')
  const labelMatch = /\(([^)]*)\)/.exec(query)
  let label = ''
  if (labelMatch?.[1]) {
    try {
      label = decodeURIComponent(labelMatch[1])
    } catch {
      label = labelMatch[1]
    }
  }
  return { latitude: latitude.trim(), longitude: longitude.trim(), label }
}

export function mapsUrlFor(latitude: string, longitude: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`
}
