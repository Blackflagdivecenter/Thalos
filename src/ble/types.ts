export type DiveComputerBrand = 'shearwater' | 'suunto' | 'mares' | 'generic';

export interface BleDeviceInfo {
  id: string;
  name: string | null;
  brand: DiveComputerBrand;
  rssi: number;
}

export interface RawDive {
  diveNumber: number;
  startTimeISO: string;
  maxDepthMeters: number;
  durationSeconds: number;
  minTempCelsius: number | null;
  avgDepthMeters: number | null;
  surfaceIntervalMinutes: number | null;
  maxPressureBar: number | null;
  minPressureBar: number | null;
  gasO2Percent: number | null;
}

export type BlePhase =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'downloading'
  | 'review'
  | 'importing'
  | 'done'
  | 'error';
