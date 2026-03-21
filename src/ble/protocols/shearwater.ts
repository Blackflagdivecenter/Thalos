/**
 * Shearwater GATT Protocol
 *
 * Service: 0000fe25-0000-1000-8000-00805f9b34fb
 * Write characteristic (FEC9): client → device commands
 * Notify characteristic (FEC8): device → client responses
 *
 * Packet format: [len, type, ...payload]
 *   type 0x10 = dive header
 *   type 0xFF = end-of-dive marker
 *
 * Dive header layout (after wake + dive request):
 *   offset 0-1: dive number (LE uint16)
 *   offset 2:   year - 2000
 *   offset 3:   month
 *   offset 4:   day
 *   offset 5:   hour
 *   offset 6:   minute
 *   offset 7-8: max depth in cm (LE uint16)
 *   offset 9-10: duration in seconds (LE uint16)
 *   offset 11-12: min temp in 0.01°C (LE int16)
 *   offset 13-14: surface interval in minutes (LE uint16)
 *   offset 15-16: start pressure in mbar (LE uint16)
 *   offset 17-18: end pressure in mbar (LE uint16)
 *   offset 19: O2 percent (uint8)
 */

import { Device } from 'react-native-ble-plx';
import { RawDive } from '../types';
import { CHARS } from './index';

const SVC = '0000fe25-0000-1000-8000-00805f9b34fb';
const TIMEOUT_MS = 10_000;

function toB64(bytes: number[]): string {
  return Buffer.from(bytes).toString('base64');
}

function fromB64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

/** Send a command and await the first notify response. */
async function sendAndReceive(
  device: Device,
  serviceUUID: string,
  writeCharUUID: string,
  notifyCharUUID: string,
  command: number[]
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      sub.remove();
      reject(new Error('BLE timeout waiting for response'));
    }, TIMEOUT_MS);

    const sub = device.monitorCharacteristicForService(
      serviceUUID,
      notifyCharUUID,
      (err, char) => {
        if (err) { clearTimeout(timer); sub.remove(); reject(err); return; }
        if (char?.value) {
          clearTimeout(timer);
          sub.remove();
          resolve(fromB64(char.value));
        }
      }
    );

    device.writeCharacteristicWithResponseForService(serviceUUID, writeCharUUID, toB64(command))
      .catch(err => { clearTimeout(timer); sub.remove(); reject(err); });
  });
}

/** Read all chunks for a single dive until end-of-dive marker. */
async function readDiveChunks(device: Device, diveIndex: number): Promise<Uint8Array[]> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const timer = setTimeout(() => {
      sub.remove();
      reject(new Error('BLE timeout reading dive chunks'));
    }, 30_000);

    const sub = device.monitorCharacteristicForService(
      SVC,
      CHARS.shearwater.notify,
      (err, char) => {
        if (err) { clearTimeout(timer); sub.remove(); reject(err); return; }
        if (!char?.value) return;
        const data = fromB64(char.value);
        // End-of-dive marker: first byte 0x01, second byte 0xFF
        if (data[0] === 0x01 && data[1] === 0xFF) {
          clearTimeout(timer);
          sub.remove();
          resolve(chunks);
          return;
        }
        chunks.push(data);
      }
    );

    const cmd = [0x10, (diveIndex >> 8) & 0xff, diveIndex & 0xff];
    device.writeCharacteristicWithResponseForService(SVC, CHARS.shearwater.write, toB64(cmd))
      .catch(err => { clearTimeout(timer); sub.remove(); reject(err); });
  });
}

function parseShearwaterDive(chunks: Uint8Array[], diveIndex: number): RawDive | null {
  const header = chunks.find(c => c[1] === 0x10);
  if (!header || header.length < 22) return null;
  const payload = header.slice(2);

  const diveNum = payload[0] | (payload[1] << 8);
  const year = 2000 + payload[2];
  const month = payload[3];
  const day = payload[4];
  const hour = payload[5];
  const min = payload[6];
  const maxDepthCm = payload[7] | (payload[8] << 8);
  const durationSec = payload[9] | (payload[10] << 8);
  const minTempRaw = payload[11] | (payload[12] << 8);
  const surfaceIntervalMin = payload[13] | (payload[14] << 8);
  const startPressureMbar = payload[15] | (payload[16] << 8);
  const endPressureMbar = payload[17] | (payload[18] << 8);
  const o2Pct = payload[19];

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const mi = String(min).padStart(2, '0');
  const startTimeISO = `${year}-${mm}-${dd}T${hh}:${mi}:00`;

  // minTempRaw is int16 in 0.01°C units
  const tempInt16 = minTempRaw > 0x7FFF ? minTempRaw - 0x10000 : minTempRaw;
  const minTempCelsius = tempInt16 / 100;

  return {
    diveNumber: diveNum || diveIndex,
    startTimeISO,
    maxDepthMeters: maxDepthCm / 100,
    durationSeconds: durationSec,
    minTempCelsius: minTempCelsius,
    avgDepthMeters: null,
    surfaceIntervalMinutes: surfaceIntervalMin > 0 ? surfaceIntervalMin : null,
    maxPressureBar: startPressureMbar > 0 ? startPressureMbar / 1000 : null,
    minPressureBar: endPressureMbar > 0 ? endPressureMbar / 1000 : null,
    gasO2Percent: o2Pct > 0 ? o2Pct : null,
  };
}

export async function downloadDives(
  device: Device,
  onProgress: (n: number, total: number) => void
): Promise<RawDive[]> {
  await device.discoverAllServicesAndCharacteristics();

  // Wake device
  await device.writeCharacteristicWithResponseForService(
    SVC, CHARS.shearwater.write, toB64([0x01, 0x00])
  );
  await new Promise(r => setTimeout(r, 500));

  // Request dive count
  const countResponse = await sendAndReceive(
    device, SVC, CHARS.shearwater.write, CHARS.shearwater.notify, [0x10, 0x00]
  );
  const total = countResponse[1] ?? 0;
  if (total === 0) return [];

  const dives: RawDive[] = [];
  for (let i = 1; i <= total; i++) {
    onProgress(i - 1, total);
    const chunks = await readDiveChunks(device, i);
    const dive = parseShearwaterDive(chunks, i);
    if (dive) dives.push(dive);
  }
  onProgress(total, total);
  return dives;
}
