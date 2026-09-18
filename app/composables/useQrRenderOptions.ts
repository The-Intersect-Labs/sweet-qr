import type { Options } from 'qr-code-styling'
import type { QrGradient, QrStyleState } from '~/types'

/**
 * Single mapping from our style state to qr-code-styling options.
 *
 * The preview and the exporter both go through this, so what you see is what you
 * download. Sizes differ between the two, so px-based values (margin, logo margin)
 * are scaled by the resolution ratio to keep the *proportions* identical.
 */

/** The preview always renders at this resolution and is scaled down with CSS. */
export const PREVIEW_RESOLUTION = 1024

/** qr-code-styling expects radians; our state stores degrees. */
function toGradient(gradient: QrGradient) {
  return {
    type: gradient.type,
    rotation: (gradient.rotation * Math.PI) / 180,
    colorStops: gradient.colorStops.map((stop) => ({ ...stop })),
  }
}

export interface BuildQrOptionsInput {
  payload: string
  style: QrStyleState
  /** Output resolution in px. */
  resolution?: number
  elementType?: 'svg' | 'canvas'
}

export function buildQrOptions({
  payload,
  style,
  resolution = style.size,
  elementType = 'svg',
}: BuildQrOptionsInput): Options {
  const scale = resolution / style.size

  return {
    width: resolution,
    height: resolution,
    type: elementType,
    data: payload,
    margin: Math.round(style.margin * scale),
    image: style.logo ?? undefined,
    qrOptions: {
      errorCorrectionLevel: style.errorCorrection,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: style.logoSize,
      margin: Math.round(style.logoMargin * scale),
      crossOrigin: 'anonymous',
      saveAsBlob: true,
    },
    dotsOptions: {
      type: style.dotStyle,
      ...(style.fgGradient ? { gradient: toGradient(style.fgGradient) } : { color: style.fgColor }),
    },
    backgroundOptions: {
      ...(style.bgGradient ? { gradient: toGradient(style.bgGradient) } : { color: style.bgColor }),
    },
    cornersSquareOptions: {
      type: style.cornerSquareStyle,
      ...(style.fgGradient ? { gradient: toGradient(style.fgGradient) } : { color: style.fgColor }),
    },
    cornersDotOptions: {
      type: style.cornerDotStyle,
      ...(style.fgGradient ? { gradient: toGradient(style.fgGradient) } : { color: style.fgColor }),
    },
  }
}

export function isTransparent(color: string): boolean {
  const value = color.trim().toLowerCase()
  return value === 'transparent' || value === 'none' || value === ''
}
