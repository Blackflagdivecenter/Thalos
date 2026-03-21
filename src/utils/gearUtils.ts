import type { GearItem, GearType, DivingType } from '@/src/models';

// ── Service status ────────────────────────────────────────────────────────────

const SERVICE_INTERVAL_DAYS  = 365;  // 1 year
const SERVICE_INTERVAL_DIVES = 100;
const WARNING_DAYS            = 30;
const WARNING_DIVES           = 15;

export interface ServiceStatus {
  /** Service is overdue now */
  isDue:           boolean;
  /** Due within the warning window (30 days / 15 dives) */
  isWarning:       boolean;
  daysUntilDue:    number | null;   // null when no date reference
  divesUntilDue:   number | null;   // null when requiresService is false
  /** Which threshold triggered isDue/isWarning */
  dueTrigger:      'time' | 'dives' | 'both' | null;
}

export function getServiceStatus(item: GearItem): ServiceStatus {
  if (!item.requiresService) {
    return {
      isDue: false, isWarning: false,
      daysUntilDue: null, divesUntilDue: null,
      dueTrigger: null,
    };
  }

  // ── Dives since last service ────────────────────────────────────────────
  const divesSince    = item.diveCount - item.diveCountAtLastService;
  const divesUntilDue = SERVICE_INTERVAL_DIVES - divesSince;

  // ── Time since last service (or purchase) ──────────────────────────────
  const refDateStr = item.lastServiceDate ?? item.purchaseDate;
  let daysUntilDue: number | null = null;

  if (refDateStr) {
    const refDate  = new Date(refDateStr).getTime();
    const now      = Date.now();
    const daysSince = Math.floor((now - refDate) / (1000 * 60 * 60 * 24));
    daysUntilDue   = SERVICE_INTERVAL_DAYS - daysSince;
  }

  // ── Determine status ────────────────────────────────────────────────────
  const timeDue   = daysUntilDue  != null && daysUntilDue  <= 0;
  const divesDue  = divesUntilDue <= 0;
  const timeWarn  = daysUntilDue  != null && daysUntilDue  <= WARNING_DAYS  && !timeDue;
  const divesWarn = divesUntilDue <= WARNING_DIVES && !divesDue;

  const isDue = timeDue || divesDue;
  const isWarning = !isDue && (timeWarn || divesWarn);

  let dueTrigger: ServiceStatus['dueTrigger'] = null;
  if (timeDue && divesDue) dueTrigger = 'both';
  else if (timeDue)        dueTrigger = 'time';
  else if (divesDue)       dueTrigger = 'dives';
  else if (timeWarn && divesWarn) dueTrigger = 'both';
  else if (timeWarn)       dueTrigger = 'time';
  else if (divesWarn)      dueTrigger = 'dives';

  return { isDue, isWarning, daysUntilDue, divesUntilDue, dueTrigger };
}

// ── Gear type metadata ────────────────────────────────────────────────────────

export type GearCategory = 'exposure' | 'breathing' | 'buoyancy' | 'navigation' | 'accessory';

export interface GearTypeMeta {
  label:           string;
  icon:            string;   // Ionicons glyph name
  requiresService: boolean;
  category:        GearCategory;
}

export const GEAR_TYPE_MAP: Record<GearType, GearTypeMeta> = {
  mask:      { label: 'Mask',       icon: 'eye-outline',           requiresService: false, category: 'exposure'    },
  fins:      { label: 'Fins',       icon: 'water-outline',         requiresService: false, category: 'exposure'    },
  snorkel:   { label: 'Snorkel',    icon: 'partly-sunny-outline',  requiresService: false, category: 'exposure'    },
  boots:     { label: 'Boots',      icon: 'walk-outline',          requiresService: false, category: 'exposure'    },
  wetsuit:   { label: 'Wetsuit',    icon: 'body-outline',          requiresService: false, category: 'exposure'    },
  drysuit:   { label: 'Drysuit',    icon: 'shield-outline',        requiresService: true,  category: 'exposure'    },
  regulator: { label: 'Regulator',  icon: 'fitness-outline',       requiresService: true,  category: 'breathing'   },
  octopus:   { label: 'Octopus',    icon: 'git-branch-outline',    requiresService: true,  category: 'breathing'   },
  bcd:       { label: 'BCD',        icon: 'balloon-outline',       requiresService: true,  category: 'buoyancy'    },
  computer:  { label: 'Computer',   icon: 'watch-outline',         requiresService: true,  category: 'navigation'  },
  tank:      { label: 'Tank',       icon: 'nuclear-outline',       requiresService: true,  category: 'breathing'   },
  light:     { label: 'Light',      icon: 'flashlight-outline',    requiresService: false, category: 'accessory'   },
  knife:     { label: 'Knife',      icon: 'cut-outline',           requiresService: false, category: 'accessory'   },
  compass:   { label: 'Compass',    icon: 'compass-outline',       requiresService: false, category: 'navigation'  },
  smb:       { label: 'SMB',        icon: 'flag-outline',          requiresService: false, category: 'accessory'   },
  camera:    { label: 'Camera',     icon: 'camera-outline',        requiresService: false, category: 'accessory'   },
  other:     { label: 'Other',      icon: 'cube-outline',          requiresService: true,  category: 'accessory'   },
};

export const GEAR_CATEGORIES: GearCategory[] = ['exposure', 'breathing', 'buoyancy', 'navigation', 'accessory'];

export const GEAR_CATEGORY_LABELS: Record<GearCategory, string> = {
  exposure:   'Exposure Protection',
  breathing:  'Breathing',
  buoyancy:   'Buoyancy',
  navigation: 'Navigation & Computers',
  accessory:  'Accessories',
};

export const DIVING_TYPE_LABELS: Record<DivingType, string> = {
  recreational: 'Recreational',
  sidemount:    'Sidemount',
  doubles:      'Doubles',
  tech:         'Tech',
  freediving:   'Freediving',
  cave:         'Cave',
};
