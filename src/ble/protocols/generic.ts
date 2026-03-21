/**
 * Generic / Unknown BLE Protocol
 *
 * Attempts a Shearwater-style wake handshake. If the device responds
 * within 5s, delegates to the Shearwater parser. Otherwise returns [].
 *
 * This handler is a best-effort fallback for devices advertising an
 * unknown service UUID but using a compatible GATT serial profile.
 */

import { Device } from 'react-native-ble-plx';
import { RawDive } from '../types';
import { CHARS } from './index';
import { downloadDives as shearwaterDownload } from './shearwater';

const SVC_FALLBACK = '0000fe25-0000-1000-8000-00805f9b34fb';
const WAKE_TIMEOUT_MS = 5_000;

function toB64(bytes: number[]): string {
  return Buffer.from(bytes).toString('base64');
}

function fromB64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

async function probeShearwaterWake(device: Device): Promise<boolean> {
  return new Promise(resolve => {
    const timer = setTimeout(() => { sub.remove(); resolve(false); }, WAKE_TIMEOUT_MS);
    const sub = device.monitorCharacteristicForService(
      SVC_FALLBACK, CHARS.shearwater.notify,
      (err, char) => {
        if (err || !char?.value) return;
        const data = fromB64(char.value);
        if (data.length > 0) { clearTimeout(timer); sub.remove(); resolve(true); }
      }
    );
    device.writeCharacteristicWithResponseForService(
      SVC_FALLBACK, CHARS.shearwater.write, toB64([0x01, 0x00])
    ).catch(() => { clearTimeout(timer); sub.remove(); resolve(false); });
  });
}

export async function downloadDives(
  device: Device,
  onProgress: (n: number, total: number) => void
): Promise<RawDive[]> {
  await device.discoverAllServicesAndCharacteristics();

  const responded = await probeShearwaterWake(device);
  if (responded) {
    // Device uses Shearwater-compatible protocol — delegate
    return shearwaterDownload(device, onProgress);
  }

  // Protocol not recognized
  return [];
}
