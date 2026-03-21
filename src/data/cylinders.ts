/**
 * Comprehensive cylinder database.
 * internalVolL = physical water capacity of the cylinder in litres.
 *   This is the value used in gas-consumption calculations:
 *     bar consumed = (SAC × pAmb × time) / internalVolL
 * gasCapCuft   = gas capacity at working pressure in cubic feet (display only).
 */

export type CylinderCategory =
  | 'pony'             // Small pony / safety / stage bottles
  | 'single-al'        // Standard single aluminium
  | 'single-steel'     // Standard single steel — metric (Faber / Euro)
  | 'single-steel-us'  // Standard single steel — US LP & HP
  | 'sidemount'        // Individual sidemount cylinders OR paired configs
  | 'doubles';         // Manifolded doubles

export interface Cylinder {
  id:             string;
  name:           string;
  brand?:         string;
  internalVolL:   number;   // Litres — internal water capacity
  gasCapCuft:     number;   // Cubic feet at working pressure (display)
  workPressBar:   number;
  workPressPsi:   number;
  category:       CylinderCategory;
  material:       'aluminum' | 'steel';
  configuration:  'single' | 'sidemount-pair' | 'doubles';
}

function mkCyl(base: Omit<Cylinder, 'gasCapCuft'>): Cylinder {
  return {
    ...base,
    gasCapCuft: Math.round((base.internalVolL * base.workPressBar / 28.317) * 10) / 10,
  };
}

export const CYLINDERS: Cylinder[] = [

  // ── Pony / Safety / Stage ────────────────────────────────────────────────────
  mkCyl({ id: 'pony-al6',   name: 'AL6 Pony',     brand: 'Luxfer/Catalina',  internalVolL: 0.82,  workPressBar: 207, workPressPsi: 3000,  category: 'pony', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'pony-al13',  name: 'AL13 Pony',    brand: 'Luxfer/Catalina',  internalVolL: 1.78,  workPressBar: 207, workPressPsi: 3000,  category: 'pony', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'pony-al19',  name: 'AL19 Pony',    brand: 'Luxfer/Catalina',  internalVolL: 2.60,  workPressBar: 207, workPressPsi: 3000,  category: 'pony', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'pony-al30',  name: 'AL30 Pony',    brand: 'Luxfer/Catalina',  internalVolL: 4.11,  workPressBar: 207, workPressPsi: 3000,  category: 'pony', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'pony-s3',    name: 'Steel 3L Pony', brand: 'Faber',           internalVolL: 3.0,   workPressBar: 200, workPressPsi: 2900,  category: 'pony', material: 'steel',    configuration: 'single' }),
  mkCyl({ id: 'pony-s5',    name: 'Steel 5L Pony', brand: 'Faber',           internalVolL: 5.0,   workPressBar: 200, workPressPsi: 2900,  category: 'pony', material: 'steel',    configuration: 'single' }),
  mkCyl({ id: 'pony-hp40',  name: 'HP40 Stage',   brand: 'Faber',            internalVolL: 4.77,  workPressBar: 237, workPressPsi: 3442,  category: 'pony', material: 'steel',    configuration: 'single' }),
  mkCyl({ id: 'pony-lp30',  name: 'LP30 Stage',   brand: 'Worthington',      internalVolL: 4.66,  workPressBar: 182, workPressPsi: 2640,  category: 'pony', material: 'steel',    configuration: 'single' }),
  mkCyl({ id: 'pony-lp45',  name: 'LP45 Stage',   brand: 'Worthington',      internalVolL: 7.0,   workPressBar: 182, workPressPsi: 2640,  category: 'pony', material: 'steel',    configuration: 'single' }),

  // ── Single Aluminium ─────────────────────────────────────────────────────────
  mkCyl({ id: 'al40',  name: 'AL40',  brand: 'Luxfer/Catalina', internalVolL: 5.47,  workPressBar: 207, workPressPsi: 3000,  category: 'single-al', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'al50',  name: 'AL50',  brand: 'Luxfer/Catalina', internalVolL: 6.84,  workPressBar: 207, workPressPsi: 3000,  category: 'single-al', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'al63',  name: 'AL63',  brand: 'Luxfer/Catalina', internalVolL: 8.9,   workPressBar: 207, workPressPsi: 3000,  category: 'single-al', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'al72',  name: 'AL72',  brand: 'Luxfer',          internalVolL: 9.86,  workPressBar: 207, workPressPsi: 3000,  category: 'single-al', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'al80',  name: 'AL80',  brand: 'Luxfer/Catalina', internalVolL: 11.1,  workPressBar: 207, workPressPsi: 3000,  category: 'single-al', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'al100', name: 'AL100', brand: 'Luxfer/Catalina', internalVolL: 11.87, workPressBar: 237, workPressPsi: 3442,  category: 'single-al', material: 'aluminum', configuration: 'single' }),

  // ── Single Steel — Metric (Faber & European) ─────────────────────────────────
  mkCyl({ id: 's6',        name: 'Steel 6L',          brand: 'Faber',  internalVolL: 6.0,  workPressBar: 200, workPressPsi: 2900,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's7',        name: 'Steel 7L',          brand: 'Faber',  internalVolL: 7.0,  workPressBar: 200, workPressPsi: 2900,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's8',        name: 'Steel 8.5L',        brand: 'Faber',  internalVolL: 8.5,  workPressBar: 200, workPressPsi: 2900,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's10',       name: 'Steel 10L',         brand: 'Faber',  internalVolL: 10.0, workPressBar: 200, workPressPsi: 2900,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's11',       name: 'Steel 11L',         brand: 'Faber',  internalVolL: 11.0, workPressBar: 200, workPressPsi: 2900,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's12',       name: 'Steel 12L',         brand: 'Faber',  internalVolL: 12.0, workPressBar: 200, workPressPsi: 2900,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's12-230',   name: 'Steel 12L / 230bar', brand: 'Faber', internalVolL: 12.0, workPressBar: 230, workPressPsi: 3335,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's12-300',   name: 'Steel 12L / 300bar', brand: 'Faber', internalVolL: 12.0, workPressBar: 300, workPressPsi: 4351,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's12-2',     name: 'Steel 12.2L',       brand: 'Faber',  internalVolL: 12.2, workPressBar: 200, workPressPsi: 2900,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's14',       name: 'Steel 14L',         brand: 'Faber',  internalVolL: 14.0, workPressBar: 200, workPressPsi: 2900,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's15',       name: 'Steel 15L',         brand: 'Faber',  internalVolL: 15.0, workPressBar: 200, workPressPsi: 2900,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's15-300',   name: 'Steel 15L / 300bar', brand: 'Faber', internalVolL: 15.0, workPressBar: 300, workPressPsi: 4351,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's18',       name: 'Steel 18L',         brand: 'Faber',  internalVolL: 18.0, workPressBar: 200, workPressPsi: 2900,  category: 'single-steel', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 's20',       name: 'Steel 20L',         brand: 'Faber',  internalVolL: 20.0, workPressBar: 200, workPressPsi: 2900,  category: 'single-steel', material: 'steel', configuration: 'single' }),

  // ── Single Steel — US LP (Worthington / Pressed Steel) ───────────────────────
  mkCyl({ id: 'lp50',  name: 'LP50',  brand: 'Worthington', internalVolL: 7.76,  workPressBar: 182, workPressPsi: 2640,  category: 'single-steel-us', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 'lp72',  name: 'LP72',  brand: 'Worthington', internalVolL: 11.1,  workPressBar: 182, workPressPsi: 2640,  category: 'single-steel-us', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 'lp85',  name: 'LP85',  brand: 'Worthington', internalVolL: 13.34, workPressBar: 182, workPressPsi: 2640,  category: 'single-steel-us', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 'lp95',  name: 'LP95',  brand: 'Worthington', internalVolL: 14.82, workPressBar: 182, workPressPsi: 2640,  category: 'single-steel-us', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 'lp104', name: 'LP104', brand: 'Worthington', internalVolL: 16.18, workPressBar: 182, workPressPsi: 2640,  category: 'single-steel-us', material: 'steel', configuration: 'single' }),

  // ── Single Steel — US HP (Faber / Luxfer HP) ─────────────────────────────────
  mkCyl({ id: 'hp80',  name: 'HP80',  brand: 'Faber',           internalVolL: 10.47, workPressBar: 237, workPressPsi: 3442,  category: 'single-steel-us', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 'hp100', name: 'HP100', brand: 'Faber',           internalVolL: 12.27, workPressBar: 237, workPressPsi: 3442,  category: 'single-steel-us', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 'hp117', name: 'HP117', brand: 'Faber',           internalVolL: 15.2,  workPressBar: 237, workPressPsi: 3442,  category: 'single-steel-us', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 'hp119', name: 'HP119', brand: 'Faber',           internalVolL: 15.5,  workPressBar: 237, workPressPsi: 3442,  category: 'single-steel-us', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 'hp120', name: 'HP120', brand: 'Faber/Worthington', internalVolL: 15.7, workPressBar: 237, workPressPsi: 3442, category: 'single-steel-us', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 'hp130', name: 'HP130', brand: 'Faber',           internalVolL: 16.9,  workPressBar: 237, workPressPsi: 3442,  category: 'single-steel-us', material: 'steel', configuration: 'single' }),
  mkCyl({ id: 'hp131', name: 'HP131', brand: 'Luxfer',          internalVolL: 17.0,  workPressBar: 237, workPressPsi: 3442,  category: 'single-steel-us', material: 'steel', configuration: 'single' }),

  // ── Sidemount — individual cylinders (common sidemount models) ───────────────
  mkCyl({ id: 'sm-al40',  name: 'SM AL40 (per cyl)',   brand: 'Luxfer/Catalina', internalVolL: 5.47,  workPressBar: 207, workPressPsi: 3000, category: 'sidemount', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'sm-al50',  name: 'SM AL50 (per cyl)',   brand: 'Luxfer/Catalina', internalVolL: 6.84,  workPressBar: 207, workPressPsi: 3000, category: 'sidemount', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'sm-al63',  name: 'SM AL63 (per cyl)',   brand: 'Luxfer/Catalina', internalVolL: 8.9,   workPressBar: 207, workPressPsi: 3000, category: 'sidemount', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'sm-al80',  name: 'SM AL80 (per cyl)',   brand: 'Luxfer/Catalina', internalVolL: 11.1,  workPressBar: 207, workPressPsi: 3000, category: 'sidemount', material: 'aluminum', configuration: 'single' }),
  mkCyl({ id: 'sm-lp45',  name: 'SM LP45 (per cyl)',   brand: 'Worthington',     internalVolL: 7.0,   workPressBar: 182, workPressPsi: 2640, category: 'sidemount', material: 'steel',    configuration: 'single' }),
  mkCyl({ id: 'sm-s7',    name: 'SM Steel 7L (per cyl)', brand: 'Faber',         internalVolL: 7.0,   workPressBar: 200, workPressPsi: 2900, category: 'sidemount', material: 'steel',    configuration: 'single' }),
  mkCyl({ id: 'sm-s10',   name: 'SM Steel 10L (per cyl)', brand: 'Faber',        internalVolL: 10.0,  workPressBar: 200, workPressPsi: 2900, category: 'sidemount', material: 'steel',    configuration: 'single' }),
  mkCyl({ id: 'sm-s12',   name: 'SM Steel 12L (per cyl)', brand: 'Faber',        internalVolL: 12.0,  workPressBar: 200, workPressPsi: 2900, category: 'sidemount', material: 'steel',    configuration: 'single' }),
  mkCyl({ id: 'sm-hp40',  name: 'SM HP40 (per cyl)',   brand: 'Faber',           internalVolL: 4.77,  workPressBar: 237, workPressPsi: 3442, category: 'sidemount', material: 'steel',    configuration: 'single' }),

  // ── Sidemount — paired configs (combined total volume) ───────────────────────
  mkCyl({ id: 'smpair-al40', name: 'Sidemount 2×AL40', brand: 'Luxfer/Catalina', internalVolL: 2 * 5.47,  workPressBar: 207, workPressPsi: 3000, category: 'sidemount', material: 'aluminum', configuration: 'sidemount-pair' }),
  mkCyl({ id: 'smpair-al50', name: 'Sidemount 2×AL50', brand: 'Luxfer/Catalina', internalVolL: 2 * 6.84,  workPressBar: 207, workPressPsi: 3000, category: 'sidemount', material: 'aluminum', configuration: 'sidemount-pair' }),
  mkCyl({ id: 'smpair-al63', name: 'Sidemount 2×AL63', brand: 'Luxfer/Catalina', internalVolL: 2 * 8.9,   workPressBar: 207, workPressPsi: 3000, category: 'sidemount', material: 'aluminum', configuration: 'sidemount-pair' }),
  mkCyl({ id: 'smpair-al80', name: 'Sidemount 2×AL80', brand: 'Luxfer/Catalina', internalVolL: 2 * 11.1,  workPressBar: 207, workPressPsi: 3000, category: 'sidemount', material: 'aluminum', configuration: 'sidemount-pair' }),
  mkCyl({ id: 'smpair-lp45', name: 'Sidemount 2×LP45', brand: 'Worthington',     internalVolL: 2 * 7.0,   workPressBar: 182, workPressPsi: 2640, category: 'sidemount', material: 'steel',    configuration: 'sidemount-pair' }),
  mkCyl({ id: 'smpair-s7',   name: 'Sidemount 2×Steel 7L',  brand: 'Faber',      internalVolL: 2 * 7.0,   workPressBar: 200, workPressPsi: 2900, category: 'sidemount', material: 'steel',    configuration: 'sidemount-pair' }),
  mkCyl({ id: 'smpair-s10',  name: 'Sidemount 2×Steel 10L', brand: 'Faber',      internalVolL: 2 * 10.0,  workPressBar: 200, workPressPsi: 2900, category: 'sidemount', material: 'steel',    configuration: 'sidemount-pair' }),
  mkCyl({ id: 'smpair-s12',  name: 'Sidemount 2×Steel 12L', brand: 'Faber',      internalVolL: 2 * 12.0,  workPressBar: 200, workPressPsi: 2900, category: 'sidemount', material: 'steel',    configuration: 'sidemount-pair' }),
  mkCyl({ id: 'smpair-hp40', name: 'Sidemount 2×HP40',      brand: 'Faber',      internalVolL: 2 * 4.77,  workPressBar: 237, workPressPsi: 3442, category: 'sidemount', material: 'steel',    configuration: 'sidemount-pair' }),

  // ── Doubles — manifolded pairs ────────────────────────────────────────────────
  mkCyl({ id: 'dbl-s7',    name: 'Twin Steel 7L',   brand: 'Faber',           internalVolL: 2 * 7.0,   workPressBar: 200, workPressPsi: 2900, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-s10',   name: 'Twin Steel 10L',  brand: 'Faber',           internalVolL: 2 * 10.0,  workPressBar: 200, workPressPsi: 2900, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-s12',   name: 'Twin Steel 12L',  brand: 'Faber',           internalVolL: 2 * 12.0,  workPressBar: 200, workPressPsi: 2900, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-s12-300', name: 'Twin Steel 12L / 300bar', brand: 'Faber', internalVolL: 2 * 12.0,  workPressBar: 300, workPressPsi: 4351, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-s15',   name: 'Twin Steel 15L',  brand: 'Faber',           internalVolL: 2 * 15.0,  workPressBar: 200, workPressPsi: 2900, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-s15-300', name: 'Twin Steel 15L / 300bar', brand: 'Faber', internalVolL: 2 * 15.0,  workPressBar: 300, workPressPsi: 4351, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-s18',   name: 'Twin Steel 18L',  brand: 'Faber',           internalVolL: 2 * 18.0,  workPressBar: 200, workPressPsi: 2900, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-al72',  name: 'Twin AL72',       brand: 'Luxfer',          internalVolL: 2 * 9.86,  workPressBar: 207, workPressPsi: 3000, category: 'doubles', material: 'aluminum', configuration: 'doubles' }),
  mkCyl({ id: 'dbl-al80',  name: 'Twin AL80',       brand: 'Luxfer/Catalina', internalVolL: 2 * 11.1,  workPressBar: 207, workPressPsi: 3000, category: 'doubles', material: 'aluminum', configuration: 'doubles' }),
  mkCyl({ id: 'dbl-lp72',  name: 'Twin LP72',       brand: 'Worthington',     internalVolL: 2 * 11.1,  workPressBar: 182, workPressPsi: 2640, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-lp85',  name: 'Twin LP85',       brand: 'Worthington',     internalVolL: 2 * 13.34, workPressBar: 182, workPressPsi: 2640, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-lp95',  name: 'Twin LP95',       brand: 'Worthington',     internalVolL: 2 * 14.82, workPressBar: 182, workPressPsi: 2640, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-lp104', name: 'Twin LP104',      brand: 'Worthington',     internalVolL: 2 * 16.18, workPressBar: 182, workPressPsi: 2640, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-hp80',  name: 'Twin HP80',       brand: 'Faber',           internalVolL: 2 * 10.47, workPressBar: 237, workPressPsi: 3442, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-hp100', name: 'Twin HP100',      brand: 'Faber',           internalVolL: 2 * 12.27, workPressBar: 237, workPressPsi: 3442, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-hp117', name: 'Twin HP117',      brand: 'Faber',           internalVolL: 2 * 15.2,  workPressBar: 237, workPressPsi: 3442, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-hp119', name: 'Twin HP119',      brand: 'Faber',           internalVolL: 2 * 15.5,  workPressBar: 237, workPressPsi: 3442, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
  mkCyl({ id: 'dbl-hp120', name: 'Twin HP120',      brand: 'Faber/Worthington', internalVolL: 2 * 15.7, workPressBar: 237, workPressPsi: 3442, category: 'doubles', material: 'steel',   configuration: 'doubles' }),
  mkCyl({ id: 'dbl-hp130', name: 'Twin HP130',      brand: 'Faber',           internalVolL: 2 * 16.9,  workPressBar: 237, workPressPsi: 3442, category: 'doubles', material: 'steel',    configuration: 'doubles' }),
];

/** Quick lookup by id */
export function findCylinder(id: string): Cylinder | undefined {
  return CYLINDERS.find(c => c.id === id);
}

/** Default cylinder for metric contexts (12L steel, 200 bar) */
export const DEFAULT_CYLINDER: Cylinder =
  CYLINDERS.find(c => c.id === 's12') ?? CYLINDERS[0];

/** Human-readable volume string: "12.0 L / 85 cuft" */
export function cylVolLabel(c: Cylinder): string {
  return `${c.internalVolL.toFixed(1)} L / ${Math.round(c.gasCapCuft)} cuft`;
}

/** Category display labels */
export const CATEGORY_LABELS: Record<CylinderCategory | 'all', string> = {
  all:               'All',
  pony:              'Pony / Deco',
  'single-al':       'Aluminum',
  'single-steel':    'Steel (Metric)',
  'single-steel-us': 'Steel (US)',
  sidemount:         'Sidemount',
  doubles:           'Doubles',
};

export const CATEGORY_ORDER: (CylinderCategory | 'all')[] = [
  'all', 'pony', 'single-al', 'single-steel', 'single-steel-us', 'sidemount', 'doubles',
];
