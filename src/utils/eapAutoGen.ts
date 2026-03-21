/**
 * EAP Auto-Generation
 *
 * Uses GPS coordinates to auto-populate Emergency Action Plan fields:
 *   1. Nominatim reverse geocode  → country, for emergency number lookup
 *   2. OpenStreetMap Overpass API → nearest hospital (50 km)
 *   3. OpenStreetMap Overpass API → nearest hyperbaric chamber (200 km)
 *
 * All network calls are best-effort; failures return null fields rather
 * than throwing, so the EAP is partially filled even offline.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface EAPAutoGenResult {
  nearestHospitalName:    string | null;
  nearestHospitalAddress: string | null;
  nearestHospitalPhone:   string | null;
  nearestChamberName:     string | null;
  nearestChamberAddress:  string | null;
  nearestChamberPhone:    string | null;
  coastGuardPhone:        string | null;
  localEmergencyNumber:   string | null;
  danEmergencyNumber:     string;
  nearestExitPoint:       string | null;
  vhfChannel:             string | null;
  evacuationProcedure:    string | null;
  /** ISO 3166-1 alpha-2, lowercase */
  countryCode:            string | null;
}

interface NominatimAddress {
  country_code?: string;
  country?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  'addr:housenumber'?: string;
  'addr:street'?: string;
  'addr:city'?: string;
}
interface NominatimResponse { address?: NominatimAddress }

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}
interface OverpassResponse { elements: OverpassElement[] }

// ── Haversine distance (metres) ───────────────────────────────────────────────

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Address builder from OSM tags ────────────────────────────────────────────

function buildAddress(tags: Record<string, string>): string {
  if (tags['addr:full']) return tags['addr:full'];
  const parts: string[] = [];
  const num    = tags['addr:housenumber'];
  const street = tags['addr:street'];
  const city   = tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village'];
  const state  = tags['addr:state'];
  const post   = tags['addr:postcode'];
  if (street) parts.push(num ? `${num} ${street}` : street);
  if (city)   parts.push(city);
  if (state)  parts.push(state);
  if (post)   parts.push(post);
  return parts.join(', ');
}

// ── Nearest element picker ────────────────────────────────────────────────────

function nearestElement(
  elements: OverpassElement[],
  lat: number,
  lon: number,
): OverpassElement | null {
  if (!elements.length) return null;
  return elements
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      const dist =
        elLat != null && elLon != null
          ? haversine(lat, lon, elLat, elLon)
          : Infinity;
      return { el, dist };
    })
    .sort((a, b) => a.dist - b.dist)[0].el;
}

// ── API helpers ───────────────────────────────────────────────────────────────

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OVERPASS  = 'https://overpass-api.de/api/interpreter';
const UA        = 'Thalos-Dive-App/1.0 (emergency-planning)';

// ── Forward geocoding ─────────────────────────────────────────────────────────

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

/**
 * Convert a place name / address string to coordinates using Nominatim.
 * Returns null if not found or on network failure.
 */
export async function geocodeLocation(text: string): Promise<GeocodeResult | null> {
  const url = `${NOMINATIM}/search?q=${encodeURIComponent(text)}&format=jsonv2&limit=1&addressdetails=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return {
      lat:         parseFloat(data[0].lat),
      lon:         parseFloat(data[0].lon),
      displayName: data[0].display_name ?? text,
    };
  } catch {
    return null;
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const url = `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1&zoom=12`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const data: NominatimResponse = await res.json();
  return (data?.address?.country_code ?? '').toLowerCase() || null;
}

async function overpassQuery(query: string): Promise<OverpassElement[]> {
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UA,
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) return [];
  const data: OverpassResponse = await res.json();
  return data?.elements ?? [];
}

// ── Country tables ────────────────────────────────────────────────────────────

// Local emergency / ambulance number
const LOCAL_EMERGENCY: Record<string, string> = {
  // Americas
  us: '911', ca: '911', mx: '911', pr: '911', vi: '911',
  bz: '90',  gt: '110', hn: '199', ni: '118', cr: '911',
  pa: '911', co: '123', ve: '911', gy: '911', sr: '115',
  br: '192', ec: '911', pe: '117', bo: '118', cl: '131',
  ar: '107', uy: '105', py: '131',
  tt: '811', jm: '110', bb: '511', bs: '911', lc: '911',
  ag: '911', dm: '911', vc: '911', gd: '911', kn: '911',
  aw: '911', cw: '912', sx: '912', tc: '911', ky: '911',
  bm: '911', ht: '118', do: '911', cu: '104',
  // Europe
  gb: '999', ie: '999', fr: '15',  de: '112', it: '118',
  es: '112', pt: '112', nl: '112', be: '100', lu: '112',
  at: '144', ch: '144', li: '144', dk: '112', se: '112',
  no: '113', fi: '112', is: '112', gr: '166', mt: '196',
  cy: '112', hr: '112', ba: '124', rs: '194', me: '194',
  al: '127', mk: '194', bg: '150', ro: '112', hu: '104',
  sk: '155', cz: '155', pl: '112', lt: '112', lv: '113',
  ee: '112', ua: '103', md: '903', si: '112',
  // Mediterranean / Middle East / Africa
  ma: '15',  dz: '14',  tn: '190', ly: '913', eg: '123',
  il: '101', lb: '140', tr: '112', jo: '911', sy: '110',
  ae: '998', qa: '999', kw: '112', bh: '999', om: '9999',
  sa: '911', ye: '191', iq: '122', ir: '115',
  // Africa
  za: '10177',ke: '999', tz: '112', ug: '999', mu: '114',
  mz: '117', mg: '117', sc: '999', mw: '998', zm: '993',
  rw: '912', et: '907', dj: '18',  so: '888', na: '081',
  bw: '997', zw: '994', ao: '113',
  // Asia-Pacific
  jp: '119', kr: '119', cn: '120', sg: '995', my: '999',
  id: '119', ph: '911', th: '1669',vn: '115', kh: '119',
  mm: '999', la: '195', bn: '991', tl: '110',
  au: '000', nz: '111', fj: '911', pg: '111', sb: '999',
  vu: '112', to: '911',
  // Indian Ocean / South Asia
  mv: '102', lk: '110', in: '112', pk: '115', bd: '999',
  np: '102', bt: '112',
  // Pacific
  ws: '999', ki: '992', mh: '625', fm: '320', pw: '488',
  nr: '111', ck: '999', nu: '4333', tv: '911', pf: '15',
  nc: '15',
};

// Maritime / Coast Guard
const COAST_GUARD: Record<string, string> = {
  us: '+1-305-415-6800',  ca: '+1-800-565-1582',
  gb: '999',              ie: '999',
  au: '000',              nz: '111',
  jp: '118',              kr: '122',
  mx: '+52-55-5261-3600', br: '185',
  cl: '138',              ar: '106',
  co: '+57-1-742-4774',
  // Southeast Asia
  sg: '+65-1800-110-0000',my: '+60-3-2691-2626',
  id: '+62-21-500-400',   ph: '+63-2-8527-8481',
  th: '1196',             vn: '+84-4-3943-4310',
  // Mediterranean / Europe
  it: '1530',             gr: '108',
  es: '+34-900-202-202',  fr: '196',
  mt: '196',              hr: '9155',
  tr: '158',              cy: '1893',
  pt: '112',              nl: '+31-70-311-7300',
  // Indian Ocean
  mv: '191',              lk: '+94-11-242-6026',
  // Caribbean
  jm: '+1-876-922-0825',  bb: '+1-246-427-8819',
  bs: '+1-242-302-3900',  tt: '+1-868-634-4440',
  tc: '+1-649-946-2160',  ky: '+1-345-949-8761',
  // Middle East / Red Sea
  eg: '122',              il: '104',
  ae: '+971-2-502-0200',  sa: '994',
  // Africa
  za: '+27-21-938-3500',  ke: '+254-20-222-2120',
  ng: '+234-9-461-4900',  gh: '+233-21-229-935',
  mu: '120',              sc: '248',
};

// DAN regional emergency line
function getDanNumber(cc: string): string {
  const americasCC = new Set([
    'us','ca','mx','bz','gt','hn','ni','cr','pa','co','ve','gy','sr',
    'br','ec','pe','bo','cl','ar','uy','py','tt','jm','bb','lc','ag',
    'dm','vc','gd','kn','aw','bq','cw','sx','mq','gp','tc','ky','bm',
    'vi','pr','ht','do','bs','cu','vg',
  ]);
  const europeCC = new Set([
    'gb','fr','de','it','es','pt','nl','be','lu','at','ch','li','dk',
    'se','no','fi','is','ie','gr','mt','cy','hr','ba','rs','me','al',
    'mk','bg','ro','hu','sk','cz','pl','lt','lv','ee','by','ua','md',
    'si','ma','dz','tn','ly','eg','il','lb','tr','jo','sy','xk',
    'ae','qa','kw','bh','om','sa','ye','iq','ir',
  ]);
  const asiaPacificCC = new Set([
    'au','nz','fj','pg','sb','vu','to','ws','ki','mh','fm','pw','nr',
    'ck','nu','tv','pf','nc','mv','lk','in','pk','bd','np','bt','mm',
    'th','vn','kh','la','sg','my','id','ph','bn','tl','cn',
  ]);
  const southernAfricaCC = new Set([
    'za','na','bw','zw','mz','mg','sc','mu','km','re','mw','zm','ao',
    'tz','ke','ug','rw','bi','et','dj','er','so','sd','gh','ng','sn',
  ]);

  if (cc === 'jp') return '+81-3-3812-4999';   // DAN Japan
  if (cc === 'kr') return '+82-2-3010-4599';   // DAN Korea
  if (americasCC.has(cc))      return '+1-919-684-9111';      // DAN America
  if (europeCC.has(cc))        return '+39-06-4211-5685';     // DAN Europe
  if (asiaPacificCC.has(cc))   return '+61-8-8212-9242';      // DAN Asia-Pacific
  if (southernAfricaCC.has(cc)) return '+27-11-254-1112';     // DAN Southern Africa
  return '+1-919-684-9111'; // DAN America as global default
}

// ── Static Florida hyperbaric chamber database ────────────────────────────────
// OSM barely tags US hyperbaric facilities, so we maintain this static list
// of known Florida (and nearby) hyperbaric medicine programs.  Distances are
// computed at runtime with haversine — fully offline.

interface StaticChamber {
  name: string;
  address: string;
  phone: string;
  lat: number;
  lon: number;
}

const FL_CHAMBERS: StaticChamber[] = [
  // ── Florida Keys / South Dade (closest to most Keys dive sites)
  { name: 'Jackson South Medical Center — Hyperbaric Medicine',
    address: '9333 SW 152nd St, Miami, FL 33157',
    phone: '(305) 256-5250', lat: 25.583, lon: -80.373 },
  // ── Broward / Southeast FL
  { name: 'Memorial Regional Hospital — Wound Healing & Hyperbaric Center',
    address: '3501 Johnson St, Hollywood, FL 33021',
    phone: '(954) 265-3000', lat: 26.024, lon: -80.148 },
  { name: 'Broward Health Medical Center — Hyperbaric Medicine',
    address: '1600 S Andrews Ave, Fort Lauderdale, FL 33316',
    phone: '(954) 355-4400', lat: 26.094, lon: -80.130 },
  // ── Palm Beach
  { name: 'Palm Beach Gardens Medical Center — Wound Care & Hyperbaric',
    address: '3360 Burns Rd, Palm Beach Gardens, FL 33410',
    phone: '(561) 622-1411', lat: 26.832, lon: -80.118 },
  { name: 'Indian River Medical Center — Wound Care & Hyperbaric',
    address: '1000 36th St, Vero Beach, FL 32960',
    phone: '(772) 567-4311', lat: 27.657, lon: -80.411 },
  // ── Southwest FL / Gulf Coast
  { name: 'NCH North Naples Hospital — Wound Care & Hyperbaric',
    address: '11190 Health Park Blvd, Naples, FL 34110',
    phone: '(239) 552-7000', lat: 26.300, lon: -81.788 },
  { name: 'Lee Health Cape Coral Hospital — Hyperbaric Medicine',
    address: '636 Del Prado Blvd N, Cape Coral, FL 33909',
    phone: '(239) 424-2000', lat: 26.683, lon: -81.952 },
  { name: 'Sarasota Memorial Hospital — Wound Care & Hyperbaric',
    address: '1700 S Tamiami Trail, Sarasota, FL 34239',
    phone: '(941) 917-9000', lat: 27.300, lon: -82.530 },
  // ── Tampa Bay / Pinellas
  { name: 'Bayfront Health St. Petersburg — Wound & Hyperbaric Center',
    address: '701 6th St S, St. Petersburg, FL 33701',
    phone: '(727) 893-6141', lat: 27.772, lon: -82.644 },
  { name: 'Tampa General Hospital — Hyperbaric Medicine',
    address: '1 Tampa General Cir, Tampa, FL 33606',
    phone: '(813) 844-7000', lat: 27.941, lon: -82.458 },
  // ── Central FL
  { name: 'AdventHealth Heart of Florida — Wound Care & Hyperbaric',
    address: '40100 US-27, Davenport, FL 33837',
    phone: '(863) 422-4971', lat: 28.150, lon: -81.616 },
  // ── North FL / Springs region
  { name: 'UF Health Shands Hospital — Hyperbaric Medicine',
    address: '1600 SW Archer Rd, Gainesville, FL 32608',
    phone: '(352) 265-0111', lat: 29.638, lon: -82.344 },
  // ── Northeast FL / Jacksonville
  { name: 'Baptist Medical Center — Wound Care & Hyperbaric Center',
    address: '800 Prudential Dr, Jacksonville, FL 32207',
    phone: '(904) 202-2000', lat: 30.300, lon: -81.641 },
  { name: 'UF Health Jacksonville — Hyperbaric Medicine',
    address: '655 W 8th St, Jacksonville, FL 32209',
    phone: '(904) 244-0411', lat: 30.333, lon: -81.673 },
  // ── Panhandle
  { name: 'Ascension Sacred Heart Hospital — Wound & Hyperbaric Center',
    address: '5151 N 9th Ave, Pensacola, FL 32504',
    phone: '(850) 416-7000', lat: 30.456, lon: -87.197 },
  { name: 'HCA Florida Gulf Coast Hospital — Hyperbaric Medicine',
    address: '449 W 23rd St, Panama City, FL 32405',
    phone: '(850) 769-8341', lat: 30.179, lon: -85.679 },
  // ── Neighbouring states (for panhandle/border coordinates)
  { name: 'USA Health University Hospital — Hyperbaric Medicine (Mobile, AL)',
    address: '2451 Fillingim St, Mobile, AL 36617',
    phone: '(251) 471-7000', lat: 30.698, lon: -88.075 },
  { name: 'Memorial Health University Medical Center — Hyperbaric (Savannah, GA)',
    address: '4700 Waters Ave, Savannah, GA 31404',
    phone: '(912) 350-8000', lat: 32.017, lon: -81.063 },
];

/**
 * Return the nearest static hyperbaric chamber within maxDistKm kilometres.
 * Returns null if none within range (caller should fall back to Overpass).
 */
function nearestStaticChamber(
  lat: number,
  lon: number,
  maxDistKm = 300,
): StaticChamber | null {
  let best: StaticChamber | null = null;
  let bestDist = Infinity;
  for (const c of FL_CHAMBERS) {
    const d = haversine(lat, lon, c.lat, c.lon);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best && bestDist <= maxDistKm * 1000 ? best : null;
}

// ── VHF emergency channel by country ─────────────────────────────────────────

function getVhfChannel(cc: string): string | null {
  // Channel 16 is the international maritime distress / calling channel.
  // A handful of countries use a different primary calling channel, but 16
  // is still monitored everywhere — safe to default to it globally.
  const ch16Countries = new Set([
    'us','ca','mx','bs','bm','tc','ky','cu','jm','ht','do','pr','vi',
    'tt','bb','lc','ag','dm','vc','gd','kn','aw','cw','sx','bq',
    'gb','ie','fr','de','it','es','pt','nl','be','dk','se','no','fi',
    'is','gr','mt','cy','hr','si','bg','ro','ua','tr',
    'au','nz','sg','my','ph','id','jp','kr',
    'br','ar','cl','co','pe','ve',
    'za','ke','mu','sc',
  ]);
  if (ch16Countries.has(cc) || cc === '') return 'Channel 16';
  return 'Channel 16'; // Universal default
}

// ── Evacuation procedure template ─────────────────────────────────────────────

function buildEvacuationProcedure(result: Omit<EAPAutoGenResult, 'evacuationProcedure'>): string {
  const emergency = result.localEmergencyNumber ?? '911';
  const dan       = result.danEmergencyNumber;
  const vhf       = result.vhfChannel ? `Broadcast MAYDAY on ${result.vhfChannel}.` : '';
  const chamber   = result.nearestChamberName
    ? `Transport to hyperbaric chamber:\n  ${result.nearestChamberName}${result.nearestChamberAddress ? ', ' + result.nearestChamberAddress : ''}${result.nearestChamberPhone ? '\n  ☎ ' + result.nearestChamberPhone : ''}`
    : 'Transport to nearest hyperbaric chamber (contact DAN for nearest facility).';
  const hospital  = result.nearestHospitalName
    ? `Nearest hospital if chamber unavailable:\n  ${result.nearestHospitalName}${result.nearestHospitalPhone ? ' — ' + result.nearestHospitalPhone : ''}`
    : '';
  const exitLine  = result.nearestExitPoint
    ? `Exit/assembly point: ${result.nearestExitPoint}.`
    : '';

  const steps = [
    '1. Remove diver from water. Ensure scene safety.',
    '2. Administer 100% O₂ immediately (8–15 L/min NRB mask). Do NOT remove if conscious.',
    '3. Do NOT give aspirin, ibuprofen, or alcohol.',
    `4. Call local emergency: ${emergency}.`,
    `5. Call DAN emergency: ${dan}.`,
    vhf ? `6. ${vhf}` : '',
    exitLine ? `7. ${exitLine}` : '',
    `8. ${chamber}`,
    hospital ? `9. ${hospital}` : '',
    '10. Keep diver lying flat, warm, and hydrated. Monitor breathing.',
    '11. Do NOT allow diver to fly without physician clearance.',
  ].filter(Boolean).join('\n');

  return steps;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Fetch emergency data for a GPS coordinate.
 * Throws only on programming errors; network failures return partial results.
 * Caller should await with a reasonable timeout via Promise.race if needed.
 */
export async function generateEAPFromCoords(
  latitude: number,
  longitude: number,
): Promise<EAPAutoGenResult> {
  const result: EAPAutoGenResult = {
    nearestHospitalName:    null,
    nearestHospitalAddress: null,
    nearestHospitalPhone:   null,
    nearestChamberName:     null,
    nearestChamberAddress:  null,
    nearestChamberPhone:    null,
    coastGuardPhone:        null,
    localEmergencyNumber:   null,
    danEmergencyNumber:     getDanNumber('us'),
    nearestExitPoint:       null,
    vhfChannel:             null,
    evacuationProcedure:    null,
    countryCode:            null,
  };

  // ── Step 1: Reverse geocode → country code ───────────────────────────────
  let cc = '';
  try {
    cc = (await reverseGeocode(latitude, longitude)) ?? '';
    if (cc) {
      result.countryCode           = cc;
      result.localEmergencyNumber  = LOCAL_EMERGENCY[cc] ?? '112';
      result.coastGuardPhone       = COAST_GUARD[cc] ?? null;
      result.danEmergencyNumber    = getDanNumber(cc);
      result.vhfChannel            = getVhfChannel(cc);
    } else {
      // Default to US values for unknown country (most likely US coastal)
      result.vhfChannel = 'Channel 16';
    }
  } catch {
    // Network unavailable — continue to try Overpass anyway
    result.vhfChannel = 'Channel 16';
  }

  // ── Step 2: Nearest hospital (50 km) ────────────────────────────────────
  try {
    const q = `
[out:json][timeout:15];
(
  node[amenity=hospital](around:50000,${latitude},${longitude});
  way[amenity=hospital](around:50000,${latitude},${longitude});
);
out center 8;`;
    const elements = await overpassQuery(q);
    const el = nearestElement(elements, latitude, longitude);
    if (el) {
      const t = el.tags ?? {};
      result.nearestHospitalName    = t.name ?? 'Hospital';
      result.nearestHospitalAddress = buildAddress(t) || null;
      result.nearestHospitalPhone   =
        t.phone ?? t['contact:phone'] ?? t['phone:number'] ?? null;
    }
  } catch { /* continue */ }

  // ── Step 3: Nearest hyperbaric chamber ───────────────────────────────────
  // Strategy: try static FL chamber database first (reliable, offline);
  // fall back to Overpass for non-FL / out-of-range coordinates.
  try {
    const staticChamber = nearestStaticChamber(latitude, longitude);
    if (staticChamber) {
      result.nearestChamberName    = staticChamber.name;
      result.nearestChamberAddress = staticChamber.address;
      result.nearestChamberPhone   = staticChamber.phone;
    } else {
      // Overpass fallback for non-FL locations
      const q = `
[out:json][timeout:20];
(
  node[healthcare:speciality~"diving_medicine|hyperbaric",i](around:300000,${latitude},${longitude});
  way[healthcare:speciality~"diving_medicine|hyperbaric",i](around:300000,${latitude},${longitude});
  node[amenity=hospital][name~"hyperbaric|chamber|wound care|dive",i](around:300000,${latitude},${longitude});
  way[amenity=hospital][name~"hyperbaric|chamber|wound care|dive",i](around:300000,${latitude},${longitude});
);
out center 5;`;
      const elements = await overpassQuery(q);
      const el = nearestElement(elements, latitude, longitude);
      if (el) {
        const t = el.tags ?? {};
        result.nearestChamberName    = t.name ?? 'Hyperbaric Chamber';
        result.nearestChamberAddress = buildAddress(t) || null;
        result.nearestChamberPhone   =
          t.phone ?? t['contact:phone'] ?? t['phone:number'] ?? null;
      }
    }
  } catch { /* continue */ }

  // ── Step 4: Nearest exit point (marina / boat ramp) ──────────────────────
  try {
    const q = `
[out:json][timeout:15];
(
  node[leisure=marina](around:30000,${latitude},${longitude});
  way[leisure=marina](around:30000,${latitude},${longitude});
  node[amenity=boat_ramp](around:30000,${latitude},${longitude});
  way[amenity=boat_ramp](around:30000,${latitude},${longitude});
  node[amenity=ferry_terminal](around:30000,${latitude},${longitude});
);
out center 8;`;
    const elements = await overpassQuery(q);
    const el = nearestElement(elements, latitude, longitude);
    if (el) {
      const t = el.tags ?? {};
      const name = t.name ?? (
        (el.tags?.leisure === 'marina') ? 'Marina' :
        (el.tags?.amenity === 'boat_ramp') ? 'Boat Ramp' : 'Exit Point'
      );
      const addr = buildAddress(t);
      result.nearestExitPoint = addr ? `${name} — ${addr}` : name;
    }
  } catch { /* continue */ }

  // ── Step 5: Evacuation procedure (auto-generated template) ───────────────
  result.evacuationProcedure = buildEvacuationProcedure(result);

  return result;
}
