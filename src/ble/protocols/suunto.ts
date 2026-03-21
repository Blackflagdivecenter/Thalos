/**
 * Suunto DM6 BLE Protocol
 *
 * Service: 0000fefb-0000-1000-8000-00805f9b34fb (UUCP/UART service)
 * Uses same write (FEC9) / notify (FEC8) characteristic pattern as Shearwater.
 *
 * Protocol:
 *   Handshake:  write [0x00] → device responds with firmware version bytes
 *   Dive list:  write [0x08, 0x00, 0x00] → response [0x08, count_hi, count_lo, ...]
 *   Dive detail: write [0x09, 0x00, idx_hi, idx_lo] → response with dive record
 *
 * Dive record layout:
 *   offset 0:   response type (0x09)
 *   offset 1-2: dive index (BE uint16)
 *   offset 3-6: timestamp (unix seconds, BE uint32)
 *   offset 7-8: max depth in cm (BE uint16)
 *   offset 9-10: duration in seconds (BE uint16)
 *   offset 11-12: min temp in 0.1°C (BE int16)
 *   offset 13-14: surface interval in minutes (BE uint16)
 *   offset 15-16: start pressure in mbar/10 → bar * 100 (BE uint16)
 *   offset 17-18: end pressure in mbar/10 (BE uint16)
 *   offset 19: O2 percent (uint8)
 */

import { Device } from 'react-native-ble-plx';
import { RawDive } from '../types';
import { CHARS } from './index';

const SVC = '0000fefb-0000-1000-8000-00805f9b34fb';
const TIMEOUT_MS = 10_000;

function toB64(bytes: number[]): string {
  return Buffer.from(bytes).toString('base64');
}

function fromB64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

async function sendAndReceive(
  device: Device,
  command: number[]
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { sub.remove(); reject(new Error('BLE timeout')); }, TIMEOUT_MS);
    const sub = device.monitorCharacteristicForService(
      SVC, CHARS.suunto.notify,
      (err, char) => {
        if (err) { clearTimeout(timer); sub.remove(); reject(err); return; }
        if (char?.value) { clearTimeout(timer); sub.remove(); resolve(fromB64(char.value)); }
      }
    );
    device.writeCharacteristicWithResponseForService(SVC, CHARS.suunto.write, toB64(command))
      .catch(err => { clearTimeout(timer); sub.remove(); reject(err); });
  });
}

function parseSuuntoDive(data: Uint8Array, idx: number): RawDive | null {
  if (data.length < 20) return null;
  // Big-endian reads
  const unixSec = (data[3] << 24) | (data[4] << 16) | (data[5] << 8) | data[6];
  const maxDepthCm = (data[7] << 8) | data[8];
  const durationSec = (data[9] << 8) | data[10];
  const tempRaw = (data[11] << 8) | data[12];
  const surfaceMin = (data[13] << 8) | data[14];
  const startP = (data[15] << 8) | data[16];
  const endP = (data[17] << 8) | data[18];
  const o2 = data[19];

  const dt = new Date(unixSec * 1000);
  const startTimeISO = dt.toISOString().slice(0, 19);

  const tempInt16 = tempRaw > 0x7FFF ? tempRaw - 0x10000 : tempRaw;
  const minTempCelsius = tempInt16 / 10;

  return {
    diveNumber: idx,
    startTimeISO,
    maxDepthMeters: maxDepthCm / 100,
    durationSeconds: durationSec,
    minTempCelsius,
    avgDepthMeters: null,
    surfaceIntervalMinutes: surfaceMin > 0 ? surfaceMin : null,
    maxPressureBar: startP > 0 ? startP / 100 : null,
    minPressureBar: endP > 0 ? endP / 100 : null,
    gasO2Percent: o2 > 0 ? o2 : null,
  };
}

export async function downloadDives(
  device: Device,
  onProgress: (n: number, total: number) => void
): Promise<RawDive[]> {
  await device.discoverAllServicesAndCharacteristics();

  // Handshake
  await sendAndReceive(device, [0x00]);
  await new Promise(r => setTimeout(r, 300));

  // Get dive count
  const listResp = await sendAndReceive(device, [0x08, 0x00, 0x00]);
  if (listResp[0] !== 0x08) return [];
  const total = (listResp[1] << 8) | listResp[2];
  if (total === 0) return [];

  const dives: RawDive[] = [];
  for (let i = 0; i < total; i++) {
    onProgress(i, total);
    const cmd = [0x09, 0x00, (i >> 8) & 0xff, i & 0xff];
    const resp = await sendAndReceive(device, cmd);
    const dive = parseSuuntoDive(resp, i + 1);
    if (dive) dives.push(dive);
  }
  onProgress(total, total);
  return dives;
}
