import { describe, expect, it } from 'vitest'
import type { QrStyleState } from '~/types'
import { PREVIEW_RESOLUTION, buildQrOptions, isTransparent } from '~/composables/useQrRenderOptions'
import { createDefaultStyle } from '~/lib/storage'

function style(overrides: Partial<QrStyleState> = {}): QrStyleState {
  return { ...createDefaultStyle(), ...overrides }
}

describe('margin scaling', () => {
  it('renders the export margin verbatim at the export resolution', () => {
    const options = buildQrOptions({ payload: 'x', style: style({ size: 1024, margin: 16 }), resolution: 1024 })
    expect(options.width).toBe(1024)
    expect(options.margin).toBe(16)
  })

  it('scales the margin down for the preview so proportions match', () => {
    // 16px inside 2048 should look half as thick when previewed at 1024.
    const options = buildQrOptions({ payload: 'x', style: style({ size: 2048, margin: 16 }), resolution: PREVIEW_RESOLUTION })
    expect(options.width).toBe(PREVIEW_RESOLUTION)
    expect(options.margin).toBe(8)
  })

  it('scales the margin up for a larger export', () => {
    const options = buildQrOptions({ payload: 'x', style: style({ size: 512, margin: 16 }), resolution: 2048 })
    expect(options.margin).toBe(64)
  })

  it('scales the logo margin the same way', () => {
    const options = buildQrOptions({
      payload: 'x',
      style: style({ size: 2048, logoMargin: 20 }),
      resolution: PREVIEW_RESOLUTION,
    })
    expect(options.imageOptions?.margin).toBe(10)
  })
})

describe('colours and gradients', () => {
  it('uses a flat colour when there is no gradient', () => {
    const options = buildQrOptions({ payload: 'x', style: style({ fgColor: '#123456', fgGradient: null }) })
    expect(options.dotsOptions?.color).toBe('#123456')
    expect(options.dotsOptions?.gradient).toBeUndefined()
  })

  it('converts gradient rotation from degrees to radians', () => {
    const options = buildQrOptions({
      payload: 'x',
      style: style({
        fgGradient: {
          type: 'linear',
          rotation: 180,
          colorStops: [
            { offset: 0, color: '#000000' },
            { offset: 1, color: '#ffffff' },
          ],
        },
      }),
    })
    expect(options.dotsOptions?.gradient?.rotation).toBeCloseTo(Math.PI)
    expect(options.dotsOptions?.gradient?.type).toBe('linear')
    // Corners follow the same gradient as the dots.
    expect(options.cornersSquareOptions?.gradient).toBeDefined()
    expect(options.cornersDotOptions?.gradient).toBeDefined()
    expect(options.dotsOptions?.color).toBeUndefined()
  })

  it('passes a transparent background straight through', () => {
    const options = buildQrOptions({ payload: 'x', style: style({ bgColor: 'transparent', bgGradient: null }) })
    expect(options.backgroundOptions?.color).toBe('transparent')
  })

  it('reports transparency for the preview checkerboard', () => {
    expect(isTransparent('transparent')).toBe(true)
    expect(isTransparent('  TRANSPARENT ')).toBe(true)
    expect(isTransparent('#ffffff')).toBe(false)
  })
})

describe('element type and payload', () => {
  it('defaults to svg for the preview', () => {
    expect(buildQrOptions({ payload: 'x', style: style() }).type).toBe('svg')
  })

  it('can render canvas for PNG export', () => {
    const options = buildQrOptions({ payload: 'x', style: style(), elementType: 'canvas' })
    expect(options.type).toBe('canvas')
  })

  it('carries the payload and error correction level', () => {
    const options = buildQrOptions({ payload: 'https://example.com', style: style({ errorCorrection: 'H' }) })
    expect(options.data).toBe('https://example.com')
    expect(options.qrOptions?.errorCorrectionLevel).toBe('H')
  })

  it('passes the logo and hides dots behind it', () => {
    const options = buildQrOptions({
      payload: 'x',
      style: style({ logo: 'data:image/png;base64,AAAA', logoSize: 0.4 }),
    })
    expect(options.image).toBe('data:image/png;base64,AAAA')
    expect(options.imageOptions?.imageSize).toBe(0.4)
    expect(options.imageOptions?.hideBackgroundDots).toBe(true)
  })

  it('omits the logo entirely when there is none', () => {
    expect(buildQrOptions({ payload: 'x', style: style({ logo: null }) }).image).toBeUndefined()
  })
})
