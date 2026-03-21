/**
 * Minimal FIT (Flexible and Interoperable Data Transfer) parser.
 * Extracts dive-relevant fields from Garmin dive computer FIT files.
 * Supports FIT protocol version 1.x / 2.x.
 */

export interface FitDiveSummary {
  startTime: string;       // ISO 8601
  durationSec: number;
  maxDepthM: number;
  avgDepthM: number;
  waterTempC: number | null;
  surfaceIntervalSec: number | null;
  o2Percent: number | null;
}

// ─── FIT constants ─────────────────────────────────────────────────────────────

const FIT_HEADER_SIZE_OFFSET  = 0;
const FIT_PROTOCOL_VER_OFFSET = 1;
const FIT_DATA_SIZE_OFFSET    = 4;
const FIT_DATA_TYPE_OFFSET    = 8;    // ".FIT"

const MESG_TYPE_DIVE_SUMMARY  = 269;
const MESG_TYPE_RECORD        = 20;

// FIT base types
const BASE_SINT8   = 0x01;
const BASE_UINT8   = 0x02;
const BASE_SINT16  = 0x83;
const BASE_UINT16  = 0x84;
const BASE_SINT32  = 0x85;
const BASE_UINT32  = 0x86;
const BASE_FLOAT32 = 0x88;
const BASE_FLOAT64 = 0x89;
const BASE_UINT8Z  = 0x0A;
const BASE_UINT16Z = 0x8B;
const BASE_UINT32Z = 0x8C;

// FIT epoch: 1989-12-31T00:00:00Z
const FIT_EPOCH_MS = 631065600000;

function fitTimeToISO(fitTimestamp: number): string {
  return new Date(FIT_EPOCH_MS + fitTimestamp * 1000).toISOString();
}

function baseTypeSize(bt: number): number {
  switch (bt & 0x9F) {
    case 0x01: case 0x02: case 0x07: case 0x0A: return 1;
    case 0x03: case 0x04: case 0x0B: return 2;
    case 0x05: case 0x06: case 0x08: case 0x0C: return 4;
    case 0x09: case 0x0D: return 8;
    default: return 1;
  }
}

interface FieldDef {
  fieldNum: number;
  size: number;
  baseType: number;
}

interface MesgDef {
  arch: 'little' | 'big';
  globalMesgNum: number;
  fields: FieldDef[];
  totalSize: number;
}

// ─── Parser ────────────────────────────────────────────────────────────────────

export function parseFitBuffer(buffer: ArrayBuffer): FitDiveSummary[] {
  const view   = new DataView(buffer);
  const bytes  = new Uint8Array(buffer);
  const len    = bytes.length;

  // Validate header
  const headerSize = view.getUint8(FIT_HEADER_SIZE_OFFSET);
  if (headerSize < 12) throw new Error('Invalid FIT header');
  const dataType = String.fromCharCode(
    bytes[FIT_DATA_TYPE_OFFSET], bytes[9], bytes[10], bytes[11],
  );
  if (dataType !== '.FIT') throw new Error('Not a FIT file');

  const localMesgDefs: Map<number, MesgDef> = new Map();
  const results: FitDiveSummary[] = [];

  let pos = headerSize;
  const dataEnd = headerSize + view.getUint32(FIT_DATA_SIZE_OFFSET, true);

  while (pos < dataEnd && pos < len - 1) {
    const recordHeader = bytes[pos++];
    const isDefinition = (recordHeader & 0x40) !== 0;
    const localNum     = recordHeader & 0x0F;

    if (isDefinition) {
      pos++; // reserved
      const arch = bytes[pos++] === 1 ? 'big' : 'little';
      const littleEndian = arch === 'little';
      const globalMesgNum = littleEndian
        ? view.getUint16(pos, true)
        : view.getUint16(pos, false);
      pos += 2;
      const numFields = bytes[pos++];
      const fields: FieldDef[] = [];
      let totalSize = 0;
      for (let i = 0; i < numFields; i++) {
        const fieldNum  = bytes[pos++];
        const size      = bytes[pos++];
        const baseType  = bytes[pos++];
        fields.push({ fieldNum, size, baseType });
        totalSize += size;
      }
      localMesgDefs.set(localNum, { arch, globalMesgNum, fields, totalSize });
    } else {
      // Data message
      const def = localMesgDefs.get(localNum);
      if (!def) { pos++; continue; }

      const msgStart = pos;
      const le = def.arch === 'little';

      if (def.globalMesgNum === MESG_TYPE_DIVE_SUMMARY) {
        const summary = parseDiveSummaryMsg(view, bytes, pos, def, le);
        if (summary) results.push(summary);
      }

      pos = msgStart + def.totalSize;
    }
  }

  return results;
}

function readField(
  view: DataView,
  pos: number,
  field: FieldDef,
  le: boolean,
): number | null {
  switch (field.baseType & 0x9F) {
    case 0x01: { const v = view.getInt8(pos);   return v === 0x7F ? null : v; }
    case 0x02: { const v = view.getUint8(pos);  return v === 0xFF ? null : v; }
    case 0x03: { const v = le ? view.getInt16(pos, true)  : view.getInt16(pos);
                  return v === 0x7FFF ? null : v; }
    case 0x04: { const v = le ? view.getUint16(pos, true) : view.getUint16(pos);
                  return v === 0xFFFF ? null : v; }
    case 0x05: { const v = le ? view.getInt32(pos, true)  : view.getInt32(pos);
                  return v === 0x7FFFFFFF ? null : v; }
    case 0x06: { const v = le ? view.getUint32(pos, true) : view.getUint32(pos);
                  return v === 0xFFFFFFFF ? null : v; }
    case 0x08: { const v = le ? view.getFloat32(pos, true): view.getFloat32(pos);
                  return isNaN(v) ? null : v; }
    default:   return null;
  }
}

// Dive Summary message field numbers (FIT SDK profile for Garmin Descent)
const DS_TIMESTAMP         = 253;
const DS_DURATION          = 2;    // seconds, scale 1
const DS_MAX_DEPTH         = 3;    // mm, scale 1000 → m
const DS_AVG_DEPTH         = 4;    // mm, scale 1000 → m
const DS_SURFACE_INTERVAL  = 5;    // seconds
const DS_START_N2          = 6;
const DS_END_N2            = 7;
const DS_O2_TOXICITY       = 8;
const DS_DIVE_NUMBER       = 9;
const DS_BOTTOM_TIME       = 10;
const DS_AVG_PRESSURE_SOD  = 11;
const DS_WATER_TYPE        = 15;
// Garmin Descent-specific
const DS_AVG_TEMP          = 14;   // °C * 100 on some devices, direct on others
const DS_O2_PERCENT        = 57;   // %

function parseDiveSummaryMsg(
  view: DataView,
  bytes: Uint8Array,
  pos: number,
  def: MesgDef,
  le: boolean,
): FitDiveSummary | null {
  let timestamp: number | null = null;
  let duration: number | null = null;
  let maxDepthMm: number | null = null;
  let avgDepthMm: number | null = null;
  let surfaceInterval: number | null = null;
  let avgTemp: number | null = null;
  let o2Percent: number | null = null;

  let fieldPos = pos;
  for (const field of def.fields) {
    const val = readField(view, fieldPos, field, le);
    if (val !== null) {
      switch (field.fieldNum) {
        case DS_TIMESTAMP:        timestamp       = val; break;
        case DS_DURATION:         duration        = val; break;
        case DS_MAX_DEPTH:        maxDepthMm      = val; break;
        case DS_AVG_DEPTH:        avgDepthMm      = val; break;
        case DS_SURFACE_INTERVAL: surfaceInterval = val; break;
        case DS_AVG_TEMP:         avgTemp         = val; break;
        case DS_O2_PERCENT:       o2Percent       = val; break;
      }
    }
    fieldPos += field.size;
  }

  if (timestamp === null || duration === null || maxDepthMm === null) return null;

  return {
    startTime:          fitTimeToISO(timestamp - duration),
    durationSec:        duration,
    maxDepthM:          maxDepthMm / 1000,
    avgDepthM:          avgDepthMm !== null ? avgDepthMm / 1000 : maxDepthMm / 1000,
    waterTempC:         avgTemp !== null ? avgTemp / 100 : null,
    surfaceIntervalSec: surfaceInterval,
    o2Percent:          o2Percent !== null ? o2Percent / 100 : null,
  };
}
