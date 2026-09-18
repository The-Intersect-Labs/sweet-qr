import type { QrStyleState } from '~/types'

export interface StylePreset {
  id: string
  label: string
  description: string
  style: Partial<QrStyleState>
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Square modules, maximum contrast',
    style: {
      fgColor: '#111114',
      bgColor: '#ffffff',
      fgGradient: null,
      bgGradient: null,
      dotStyle: 'square',
      cornerSquareStyle: 'square',
      cornerDotStyle: 'square',
    },
  },
  {
    id: 'rounded',
    label: 'Rounded',
    description: 'Soft dots and corners',
    style: {
      fgColor: '#111114',
      bgColor: '#ffffff',
      fgGradient: null,
      bgGradient: null,
      dotStyle: 'rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
    },
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Chunky, high-impact modules',
    style: {
      fgColor: '#0f172a',
      bgColor: '#ffffff',
      fgGradient: null,
      bgGradient: null,
      dotStyle: 'classy-rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
    },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Fine dots, light and airy',
    style: {
      fgColor: '#334155',
      bgColor: '#ffffff',
      fgGradient: null,
      bgGradient: null,
      dotStyle: 'dots',
      cornerSquareStyle: 'dot',
      cornerDotStyle: 'dot',
    },
  },
  {
    id: 'indigo',
    label: 'Sweet indigo',
    description: 'Signature indigo gradient',
    style: {
      fgColor: '#6366f1',
      bgColor: '#ffffff',
      fgGradient: {
        type: 'linear',
        rotation: 45,
        colorStops: [
          { offset: 0, color: '#4f46e5' },
          { offset: 1, color: '#8b5cf6' },
        ],
      },
      bgGradient: null,
      dotStyle: 'rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Warm gradient on a soft tint',
    style: {
      fgColor: '#ea580c',
      bgColor: '#fff7ed',
      fgGradient: {
        type: 'linear',
        rotation: 30,
        colorStops: [
          { offset: 0, color: '#f97316' },
          { offset: 1, color: '#e11d48' },
        ],
      },
      bgGradient: null,
      dotStyle: 'classy-rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Light modules on transparent, for dark surfaces',
    style: {
      fgColor: '#ffffff',
      bgColor: 'transparent',
      fgGradient: null,
      bgGradient: null,
      dotStyle: 'dots',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
    },
  },
]
