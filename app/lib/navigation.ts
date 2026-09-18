import type { Component } from 'vue'
import {
  FolderOpenIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  QrCodeIcon,
  ScanLineIcon,
  SettingsIcon,
} from '@lucide/vue'

export interface NavItem {
  label: string
  to: string
  icon: Component
  description: string
}

export const PRIMARY_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboardIcon,
    description: 'Overview of your codes and recent scans',
  },
  {
    label: 'Generator',
    to: '/generator',
    icon: QrCodeIcon,
    description: 'Create and customise a QR code',
  },
  {
    label: 'My QR codes',
    to: '/codes',
    icon: FolderOpenIcon,
    description: 'Your saved library',
  },
  {
    label: 'Scanner',
    to: '/scanner',
    icon: ScanLineIcon,
    description: 'Scan with a camera or an image',
  },
  {
    label: 'Scan history',
    to: '/history',
    icon: HistoryIcon,
    description: 'Everything you have scanned',
  },
]

export const SECONDARY_NAV: NavItem[] = [
  {
    label: 'Settings',
    to: '/settings',
    icon: SettingsIcon,
    description: 'Preferences, defaults and stored data',
  },
]

export function navTitleFor(path: string): string {
  return [...PRIMARY_NAV, ...SECONDARY_NAV].find((item) => item.to === path)?.label ?? 'SweetQR'
}
