/**
 * Mares BlueConnect BLE Protocol
 *
 * Service: 0000fff0-0000-1000-8000-00805f9b34fb
 * Write:   0000fff1-0000-1000-8000-00805f9b34fb
 * Notify:  0000fff2-0000-1000-8000-00805f9b34fb
 *
 * Protocol:
 *   Init:       write [0x11, 0x00 × 8] → response includes 2-byte dive count at offset 2
 *   Dive detail: write [0x21, idx_hi, idx_lo, 0x00 × 6] → response with dive record
 *
 * Dive record layout:
 *   offset 0:   response type (0x21)
 *   offset 1-2: dive index (BE uint16)
 *   offset 3-4: year (BE uint16)
 *   offset 5:   month
 *   offset 6:   day
 *   offset 7:   hour
 *   offset 8:   minute
 *   offset 9-10: max depth in cm (BE uint16)
 *   offset 11-12: duration in seconds (BE uint16)
 *   offset 13-14: min temp in 0.1°C (BE int16)
 *   offset 15-16: start pressure in bar*10 (BE uint16)
 *   offset 17-18: end pressure in bar*10 (BE uint16)
 *   offset 19: O2 percent (uint8)
 */

import { Device } from 'react-native-ble-plx';
import { RawDive } from '../types';
import { CHARS } from './index';

const SVC = '0000fff0-0000-1000-8000-00805f9b34fb';
const TIMEOUT_MS = 10_000;

function toB64(bytes: number[]): string {
  return Buffer.from(bytes).toString('base64');
}

function fromB64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

async function sendAndReceive(device: Device, command: number[]): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { sub.remove(); reject(new Error('BLE timeout')); }, TIMEOUT_MS);
    const sub = device.monitorCharacteristicForService(
      SVC, CHARS.mares.notify,
      (err, char) => {
        if (err) { clearTimeout(timer); sub.remove(); reject(err); return; }
        if (char?.value) { clearTimeout(timer); sub.remove(); resolve(fromB64(char.value)); }
      }
    );
    device.writeCharacteristicWithResponseForService(SVC, CHARS.mares.write, toB64(command))
      .catch(err => { clearTimeout(timer); sub.remove(); reject(err); });
  });
}

function parseMaresDive(data: Uint8Array, idx: number): RawDive | null {
  if (data.length < 20) return null;
  const year = (data[3] << 8) | data[4];
  const month = data[5];
  const day = data[6];
  const hour = data[7];
  const minute = data[8];
  const maxDepthCm = (data[9] << 8) | data[10];
  const durationSec = (data[11] << 8) | data[12];
  const tempRaw = (data[13] << 8) | data[14];
  const startP = (data[15] << 8) | data[16];
  const endP = (data[17] << 8) | data[18];
  const o2 = data[19];

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const mi = String(minute).padStart(2, '0');
  const startTimeISO = `${year}-${mm}-${dd}T${hh}:${mi}:00`;

  const tempInt16 = tempRaw > 0x7FFF ? tempRaw - 0x10000 : tempRaw;

  return {
    diveNumber: idx,
    startTimeISO,
    maxDepthMeters: maxDepthCm / 100,
    durationSeconds: durationSec,
    minTempCelsius: tempInt16 / 10,
    avgDepthMeters: null,
    surfaceIntervalMinutes: null,
    maxPressureBar: startP > 0 ? startP / 10 : null,
    minPressureBar: endP > 0 ? endP / 10 : null,
    gasO2Percent: o2 > 0 ? o2 : null,
  };
}

export async function downloadDives(
  device: Device,
  onProgress: (n: number, total: number) => void
): Promise<RawDive[]> {
  await device.discoverAllServicesAndCharacteristics();

  // Initialize
  const initResp = await sendAndReceive(device, [0x11, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const total = (initResp[2] << 8) | initResp[3];
  if (total === 0) return [];

  const dives: RawDive[] = [];
  for (let i = 0; i < total; i++) {
    onProgress(i, total);
    const cmd = [0x21, (i >> 8) & 0xff, i & 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    const resp = await sendAndReceive(device, cmd);
    const dive = parseMaresDive(resp, i + 1);
    if (dive) dives.push(dive);
  }
  onProgress(total, total);
  return dives;
}
