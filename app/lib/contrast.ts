/**
 * Contrast checking for QR scannability.
 *
 * Unlike a UI control, a QR code that a camera cannot separate will simply fail to
 * scan, so we warn rather than leave the user with an unusable code.
 */

const MIN_QR_CONTRAST = 3

function parseHex(value: string): [number, number, number] | null {
  const hex = value.trim().replace(/^#/, '')
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null
  const full = hex.length === 3 ? hex.replace(/./g, '$&$&') : hex
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ]
}

function channelLuminance(channel: number): number {
  const value = channel / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(color: string): number | null {
  const rgb = parseHex(color)
  if (!rgb) return null
  return (
    0.2126 * channelLuminance(rgb[0]!) +
    0.7152 * channelLuminance(rgb[1]!) +
    0.0722 * channelLuminance(rgb[2]!)
  )
}

function contrastRatio(a: string, b: string): number | null {
  const luminanceA = relativeLuminance(a)
  const luminanceB = relativeLuminance(b)
  if (luminanceA === null || luminanceB === null) return null

  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * `null` means "cannot tell" (transparent or non-hex background), which we treat as
 * fine — a transparent background inherits whatever surface it is placed on.
 */
export function hasLowContrast(foreground: string, background: string): boolean {
  const ratio = contrastRatio(foreground, background)
  return ratio !== null && ratio < MIN_QR_CONTRAST
}
