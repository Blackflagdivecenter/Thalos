import { DiveComputerBrand } from '../types';

export const SERVICE_UUIDS: Record<DiveComputerBrand, string> = {
  shearwater: '0000fe25-0000-1000-8000-00805f9b34fb',
  suunto:     '0000fefb-0000-1000-8000-00805f9b34fb',
  mares:      '0000fff0-0000-1000-8000-00805f9b34fb',
  generic:    '',
};

const SHORT_UUIDS: Record<DiveComputerBrand, string> = {
  shearwater: 'fe25',
  suunto:     'fefb',
  mares:      'fff0',
  generic:    '',
};

export function detectBrand(serviceUUIDs: string[] | null | undefined): DiveComputerBrand {
  if (!serviceUUIDs?.length) return 'generic';
  const lower = serviceUUIDs.map(u => u.toLowerCase());
  const brands: DiveComputerBrand[] = ['shearwater', 'suunto', 'mares'];
  for (const brand of brands) {
    if (lower.some(u => u === SERVICE_UUIDS[brand] || u === SHORT_UUIDS[brand])) return brand;
  }
  return 'generic';
}

export const CHARS: Record<DiveComputerBrand, { write: string; notify: string }> = {
  shearwater: {
    write:  '0000fec9-0000-1000-8000-00805f9b34fb',
    notify: '0000fec8-0000-1000-8000-00805f9b34fb',
  },
  suunto: {
    write:  '0000fec9-0000-1000-8000-00805f9b34fb',
    notify: '0000fec8-0000-1000-8000-00805f9b34fb',
  },
  mares: {
    write:  '0000fff1-0000-1000-8000-00805f9b34fb',
    notify: '0000fff2-0000-1000-8000-00805f9b34fb',
  },
  generic: {
    write:  '0000fec9-0000-1000-8000-00805f9b34fb',
    notify: '0000fec8-0000-1000-8000-00805f9b34fb',
  },
};
