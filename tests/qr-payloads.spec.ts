import { describe, expect, it } from 'vitest'
import type { QrFormData, QrTypeId } from '~/types'
import { getQrTypeDef } from '~/lib/qr/registry'
import { parseQrPayload } from '~/lib/qr/parse'
import {
  buildEmailPayload,
  buildGeoPayload,
  buildSmsPayload,
  cleanPhoneNumber,
  normalizeUrl,
  parseEmailPayload,
  parseGeoPayload,
  parseSmsPayload,
  parseVCardPayload,
  parseWifiPayload,
} from '~/lib/qr/codec'

/** Encode through the registry exactly the way the generator page does. */
function build(type: QrTypeId, form: QrFormData): string {
  return getQrTypeDef(type).build(form)
}

describe('url payloads', () => {
  it('adds a missing https scheme', () => {
    expect(normalizeUrl('example.com/path')).toBe('https://example.com/path')
    expect(build('url', { url: 'example.com' })).toBe('https://example.com')
  })

  it('leaves an explicit scheme alone', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com')
    expect(normalizeUrl('https://example.com')).toBe('https://example.com')
  })

  it('does not mistake a host:port pair for a scheme', () => {
    expect(normalizeUrl('example.com:8080/x')).toBe('https://example.com:8080/x')
  })
})

describe('wifi payloads', () => {
  it('round-trips a WPA network', () => {
    const payload = build('wifi', {
      ssid: 'Cafe Guest',
      security: 'WPA',
      password: 'hunter2',
      hidden: false,
    })
    expect(payload).toBe('WIFI:T:WPA;S:Cafe Guest;P:hunter2;;')

    const parsed = parseWifiPayload(payload)
    expect(parsed).toMatchObject({
      ssid: 'Cafe Guest',
      security: 'WPA',
      password: 'hunter2',
      hidden: false,
    })
  })

  it('escapes reserved characters and parses them back', () => {
    const ssid = 'My;Net,work:2"x\\y'
    const password = 'p;a,s:s"w\\d'
    const payload = build('wifi', { ssid, security: 'WPA', password, hidden: false })

    expect(payload).toContain('S:My\\;Net\\,work\\:2\\"x\\\\y')

    const parsed = parseWifiPayload(payload)
    expect(parsed?.ssid).toBe(ssid)
    expect(parsed?.password).toBe(password)
  })

  it('omits the password for open networks', () => {
    const payload = build('wifi', { ssid: 'Open', security: 'nopass', password: '', hidden: false })
    expect(payload).toBe('WIFI:T:nopass;S:Open;;')
    expect(parseWifiPayload(payload)?.password).toBe('')
  })

  it('includes an identity only for enterprise networks', () => {
    const enterprise = build('wifi', {
      ssid: 'Corp',
      security: 'WPA2-EAP',
      password: 'pw',
      identity: 'ada@corp.com',
      hidden: false,
    })
    expect(enterprise).toContain('I:ada@corp.com')

    const personal = build('wifi', { ssid: 'Home', security: 'WPA', password: 'pw', identity: 'ignored', hidden: false })
    expect(parseWifiPayload(personal)?.identity).toBe('')
  })

  it('records hidden networks', () => {
    const payload = build('wifi', { ssid: 'Ghost', security: 'WPA', password: 'pw', hidden: true })
    expect(payload).toContain('H:true')
    expect(parseWifiPayload(payload)?.hidden).toBe(true)
  })
})

describe('vcard payloads', () => {
  it('round-trips a full contact', () => {
    const payload = build('vcard', {
      firstName: 'Ada',
      lastName: 'Lovelace',
      organization: 'Analytical Engines',
      title: 'Mathematician',
      phone: '+1 555 010 2030',
      email: 'ada@example.com',
      website: 'example.com',
      street: '12 Marylebone Road',
      city: 'London',
      region: 'Greater London',
      postalCode: 'NW1 5LS',
      country: 'United Kingdom',
      note: 'First programmer',
    })

    expect(payload.startsWith('BEGIN:VCARD\r\nVERSION:3.0')).toBe(true)
    expect(payload.trimEnd().endsWith('END:VCARD')).toBe(true)
    expect(payload).toContain('N:Lovelace;Ada;;;')
    expect(payload).toContain('FN:Ada Lovelace')

    const parsed = parseVCardPayload(payload)
    expect(parsed).toMatchObject({
      fullName: 'Ada Lovelace',
      organization: 'Analytical Engines',
      title: 'Mathematician',
      phone: '+1 555 010 2030',
      email: 'ada@example.com',
      note: 'First programmer',
    })
    expect(parsed?.address).toContain('London')
  })

  it('escapes commas, semicolons and newlines', () => {
    const payload = build('vcard', {
      firstName: 'Ada, Jr.',
      lastName: 'Love;lace',
      organization: '',
      title: '',
      phone: '',
      email: '',
      website: '',
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: '',
      note: 'line one\nline two',
    })

    // `;` and `,` are structural in vCard; periods are not escaped.
    expect(payload).toContain('N:Love\\;lace;Ada\\, Jr.;;;')
    expect(payload).toContain('NOTE:line one\\nline two')

    const parsed = parseVCardPayload(payload)
    expect(parsed?.fullName).toBe('Ada, Jr. Love;lace')
    expect(parsed?.note).toBe('line one\nline two')
  })

  it('falls back to the organisation when there is no name', () => {
    const payload = build('vcard', {
      firstName: '',
      lastName: '',
      organization: 'Solo Studio',
      title: '',
      phone: '',
      email: '',
      website: '',
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: '',
      note: '',
    })
    expect(payload).toContain('FN:Solo Studio')
  })
})

describe('email payloads', () => {
  it('encodes the subject and body with percent escapes, not plus signs', () => {
    const payload = buildEmailPayload({ address: 'ada@example.com', subject: 'Hello World', body: 'Line1\nLine2' })
    expect(payload).toBe('mailto:ada@example.com?subject=Hello%20World&body=Line1%0ALine2')
    expect(payload).not.toContain('+')

    const parsed = parseEmailPayload(payload)
    expect(parsed).toMatchObject({ address: 'ada@example.com', subject: 'Hello World', body: 'Line1\nLine2' })
  })

  it('drops empty query parameters', () => {
    expect(buildEmailPayload({ address: 'a@b.com', subject: '', body: '' })).toBe('mailto:a@b.com')
  })
})

describe('phone payloads', () => {
  it('keeps a leading plus and strips formatting', () => {
    expect(cleanPhoneNumber('+1 (555) 010-2030')).toBe('+15550102030')
    expect(cleanPhoneNumber('555 010 2030')).toBe('5550102030')
    expect(build('phone', { number: '+1 (555) 010-2030' })).toBe('tel:+15550102030')
  })
})

describe('sms payloads', () => {
  it('round-trips a message', () => {
    const payload = buildSmsPayload({ number: '+1 555 010 2030', message: 'Hi there & welcome' })
    expect(payload).toBe('sms:+15550102030?body=Hi%20there%20%26%20welcome')

    const parsed = parseSmsPayload(payload)
    expect(parsed).toMatchObject({ number: '+15550102030', message: 'Hi there & welcome' })
  })

  it('still reads the legacy SMSTO form', () => {
    expect(parseSmsPayload('SMSTO:+15550102030:Hello there')).toMatchObject({
      number: '+15550102030',
      message: 'Hello there',
    })
  })
})

describe('location payloads', () => {
  it('round-trips coordinates with a label', () => {
    const payload = buildGeoPayload({ latitude: '51.5074', longitude: '-0.1278', label: 'SweetQR HQ' })
    expect(payload).toBe('geo:51.5074,-0.1278?q=51.5074,-0.1278(SweetQR%20HQ)')

    const parsed = parseGeoPayload(payload)
    expect(parsed).toMatchObject({ latitude: '51.5074', longitude: '-0.1278', label: 'SweetQR HQ' })
  })

  it('omits the query when there is no label', () => {
    expect(buildGeoPayload({ latitude: '1', longitude: '2', label: '' })).toBe('geo:1,2')
  })
})

describe('scan result detection', () => {
  const cases: [string, string, string][] = [
    ['https://example.com/x', 'url', 'example.com'],
    ['WIFI:T:WPA;S:Cafe;P:pw;;', 'wifi', 'Cafe'],
    ['mailto:ada@example.com?subject=Hi', 'email', 'ada@example.com'],
    ['tel:+15550102030', 'phone', '+15550102030'],
    ['sms:+15550102030?body=Hi', 'sms', '+15550102030'],
    ['SMSTO:+15550102030:Hi', 'sms', '+15550102030'],
    ['geo:51.5074,-0.1278', 'location', '51.5074,-0.1278'],
    ['just some words', 'text', 'just some words'],
  ]

  for (const [raw, type, label] of cases) {
    it(`detects ${type} from ${raw.slice(0, 24)}`, () => {
      const result = parseQrPayload(raw)
      expect(result.type).toBe(type)
      expect(result.label).toBe(label)
      expect(result.unsafe).toBe(false)
    })
  }

  it('detects vCards', () => {
    const result = parseQrPayload('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Grace Hopper\r\nEND:VCARD')
    expect(result.type).toBe('vcard')
    expect(result.label).toBe('Grace Hopper')
    expect(result.actions.some((action) => action.kind === 'download')).toBe(true)
  })

  it('never offers an Open action for an unsafe scheme', () => {
    for (const payload of ['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'file:///etc/passwd']) {
      const result = parseQrPayload(payload)
      expect(result.unsafe).toBe(true)
      expect(result.actions.some((action) => action.kind === 'open')).toBe(false)
      expect(result.actions.some((action) => action.kind === 'copy')).toBe(true)
      expect(result.raw).toBe(payload)
    }
  })

  it('offers Copy and Open for a normal web link', () => {
    const result = parseQrPayload('https://example.com')
    expect(result.unsafe).toBe(false)
    expect(result.actions.some((action) => action.kind === 'open')).toBe(true)
    expect(result.actions.some((action) => action.kind === 'copy')).toBe(true)
  })

  it('marks a Wi-Fi password as sensitive', () => {
    const result = parseQrPayload('WIFI:T:WPA;S:Cafe;P:secret;;')
    expect(result.fields.find((field) => field.label === 'Password')?.sensitive).toBe(true)
  })
})
