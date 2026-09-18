import type { QrFormData, QrTypeId, ScanAction, ScanResult, ScanResultField } from '~/types'
import { QR_TYPE_DEFS } from './registry'
import { slugify, truncate } from '~/lib/format'
import {
  describeWifiSecurity,
  hostnameOf,
  isUnsafeScheme,
  mapsUrlFor,
  parseEmailPayload,
  parseGeoPayload,
  parsePhonePayload,
  parseSmsPayload,
  parseVCardPayload,
  parseWifiPayload,
  schemeOf,
} from './codec'

/**
 * Turns an arbitrary scanned payload into a typed, presentable result.
 *
 * The UI never inspects raw strings — it renders `fields` and `actions`. Open actions
 * are only ever produced for schemes we consider safe to hand to the browser.
 */

function compact(fields: ScanResultField[]): ScanResultField[] {
  return fields.filter((field) => field.value.trim().length > 0)
}

function copyAction(label: string, value: string, primary = false): ScanAction {
  return { label, kind: 'copy', value, icon: 'copy', primary }
}

function openAction(label: string, value: string, primary = false): ScanAction {
  return { label, kind: 'open', value, icon: 'external', primary }
}

function downloadAction(label: string, value: string, filename: string, mime: string): ScanAction {
  return { label, kind: 'download', value, filename, mime, icon: 'download' }
}

export function parseQrPayload(raw: string): ScanResult {
  const trimmed = raw.trim()

  const wifi = parseWifiPayload(trimmed)
  if (wifi) {
    const fields = compact([
      { label: 'Network', value: wifi.ssid },
      { label: 'Security', value: describeWifiSecurity(wifi.security) },
      { label: 'Password', value: wifi.password, sensitive: true },
      { label: 'Identity', value: wifi.identity },
      { label: 'Hidden network', value: wifi.hidden ? 'Yes' : '' },
    ])
    const actions: ScanAction[] = []
    if (wifi.password) actions.push(copyAction('Copy password', wifi.password, true))
    actions.push(copyAction('Copy raw payload', trimmed))
    return {
      raw: trimmed,
      type: 'wifi',
      label: wifi.ssid || 'Wi-Fi network',
      fields,
      actions,
      unsafe: false,
    }
  }

  const vcard = parseVCardPayload(trimmed)
  if (vcard) {
    const fields = compact([
      { label: 'Name', value: vcard.fullName },
      { label: 'Organisation', value: vcard.organization },
      { label: 'Job title', value: vcard.title },
      { label: 'Phone', value: vcard.phone },
      { label: 'Email', value: vcard.email },
      { label: 'Website', value: vcard.website },
      { label: 'Address', value: vcard.address },
      { label: 'Note', value: vcard.note },
    ])
    return {
      raw: trimmed,
      type: 'vcard',
      label: vcard.fullName || 'Contact card',
      fields,
      actions: [
        downloadAction(
          'Download .vcf',
          trimmed,
          `${slugify(vcard.fullName, 'contact')}.vcf`,
          'text/vcard;charset=utf-8',
        ),
        copyAction('Copy vCard', trimmed),
      ],
      unsafe: false,
    }
  }

  const email = parseEmailPayload(trimmed)
  if (email) {
    const fields = compact([
      { label: 'To', value: email.address },
      { label: 'Subject', value: email.subject },
      { label: 'Message', value: email.body },
    ])
    return {
      raw: trimmed,
      type: 'email',
      label: email.address || 'Email',
      fields,
      actions: [
        openAction('Compose email', trimmed, true),
        copyAction('Copy address', email.address),
        copyAction('Copy payload', trimmed),
      ],
      unsafe: false,
    }
  }

  const phone = parsePhonePayload(trimmed)
  if (phone) {
    return {
      raw: trimmed,
      type: 'phone',
      label: phone.number || 'Phone number',
      fields: compact([{ label: 'Number', value: phone.number }]),
      actions: [
        openAction('Call number', trimmed, true),
        copyAction('Copy number', phone.number),
      ],
      unsafe: false,
    }
  }

  const sms = parseSmsPayload(trimmed)
  if (sms) {
    const fields = compact([
      { label: 'Number', value: sms.number },
      { label: 'Message', value: sms.message },
    ])
    const actions: ScanAction[] = [openAction('Open messages', trimmed, true), copyAction('Copy number', sms.number)]
    if (sms.message) actions.push(copyAction('Copy message', sms.message))
    return { raw: trimmed, type: 'sms', label: sms.number || 'SMS', fields, actions, unsafe: false }
  }

  const geo = parseGeoPayload(trimmed)
  if (geo) {
    const fields = compact([
      { label: 'Latitude', value: geo.latitude },
      { label: 'Longitude', value: geo.longitude },
      { label: 'Place', value: geo.label },
    ])
    const coordinates = `${geo.latitude},${geo.longitude}`
    return {
      raw: trimmed,
      type: 'location',
      label: geo.label || coordinates,
      fields,
      actions: [
        openAction('Open in Maps', mapsUrlFor(geo.latitude, geo.longitude), true),
        copyAction('Copy coordinates', coordinates),
        copyAction('Copy Maps link', mapsUrlFor(geo.latitude, geo.longitude)),
      ],
      unsafe: false,
    }
  }

  // Unsafe schemes are surfaced as-is for inspection, never rewritten into a URL we
  // would then be tempted to navigate to.
  if (isUnsafeScheme(trimmed)) {
    return {
      raw: trimmed,
      type: 'url',
      label: 'Unsafe link',
      fields: compact([
        { label: 'Scheme', value: schemeOf(trimmed) },
        { label: 'Payload', value: trimmed },
      ]),
      actions: [copyAction('Copy payload', trimmed, true)],
      unsafe: true,
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const host = hostnameOf(trimmed)
    const fields = compact([
      { label: 'Address', value: trimmed },
      { label: 'Domain', value: host },
    ])

    return {
      raw: trimmed,
      type: 'url',
      label: host || trimmed,
      fields,
      actions: [openAction('Open link', trimmed, true), copyAction('Copy link', trimmed)],
      unsafe: false,
    }
  }

  return {
    raw: trimmed,
    type: 'text',
    label: truncate(trimmed, 60) || 'Empty code',
    fields: compact([{ label: 'Text', value: trimmed }]),
    actions: trimmed ? [copyAction('Copy text', trimmed, true)] : [],
    unsafe: false,
  }
}

/** `?from=` handoff: seed the generator with a scanned payload. */
export function formFromPayload(result: ScanResult): { type: QrTypeId; form: QrFormData } {
  const blank = (): QrFormData => ({ ...(QR_TYPE_DEFS.find((d) => d.id === result.type)?.defaults ?? {}) })

  switch (result.type) {
    case 'url':
      return { type: 'url', form: { ...blank(), url: result.raw } }
    case 'text':
      return { type: 'text', form: { ...blank(), text: result.raw } }
    case 'email': {
      const parsed = parseEmailPayload(result.raw)
      return {
        type: 'email',
        form: {
          ...blank(),
          address: parsed?.address ?? '',
          subject: parsed?.subject ?? '',
          body: parsed?.body ?? '',
        },
      }
    }
    case 'phone': {
      const parsed = parsePhonePayload(result.raw)
      return { type: 'phone', form: { ...blank(), number: parsed?.number ?? result.raw } }
    }
    case 'sms': {
      const parsed = parseSmsPayload(result.raw)
      return {
        type: 'sms',
        form: { ...blank(), number: parsed?.number ?? '', message: parsed?.message ?? '' },
      }
    }
    case 'location': {
      const parsed = parseGeoPayload(result.raw)
      return {
        type: 'location',
        form: {
          ...blank(),
          latitude: parsed?.latitude ?? '',
          longitude: parsed?.longitude ?? '',
          label: parsed?.label ?? '',
        },
      }
    }
    case 'wifi': {
      const parsed = parseWifiPayload(result.raw)
      return {
        type: 'wifi',
        form: {
          ...blank(),
          ssid: parsed?.ssid ?? '',
          security: parsed?.security ?? 'WPA',
          password: parsed?.password ?? '',
          identity: parsed?.identity ?? '',
          hidden: parsed?.hidden ?? false,
        },
      }
    }
    case 'vcard': {
      const parsed = parseVCardPayload(result.raw)
      const [firstName = '', ...rest] = (parsed?.fullName ?? '').split(' ')
      return {
        type: 'vcard',
        form: {
          ...blank(),
          firstName,
          lastName: rest.join(' '),
          organization: parsed?.organization ?? '',
          title: parsed?.title ?? '',
          phone: parsed?.phone ?? '',
          email: parsed?.email ?? '',
          website: parsed?.website ?? '',
          note: parsed?.note ?? '',
        },
      }
    }
  }
}
