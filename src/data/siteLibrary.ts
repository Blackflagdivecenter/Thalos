/**
 * Site Library — global aggregator and browse hierarchy.
 *
 * Add new region files here as the library grows.
 * The WorldRegion concept groups countries into navigable top-level regions.
 */

import { US_SITES, US_STATES, CATEGORY_META, LibrarySite, SiteCategory } from './usSites';
import { CENTRAL_AMERICA_COUNTRY_MAP } from './centralAmericaSites';
import { SOUTH_AMERICA_COUNTRY_MAP } from './southAmericaSites';
import { CARIBBEAN_COUNTRY_MAP } from './caribbeanSites';
import { SOUTHEAST_ASIA_COUNTRY_MAP } from './southeastAsiaSites';
import { PACIFIC_COUNTRY_MAP } from './pacificSites';
import { MEDITERRANEAN_COUNTRY_MAP } from './mediterraneanSites';
import { RED_SEA_COUNTRY_MAP } from './redSeaSites';
import { INDIAN_OCEAN_COUNTRY_MAP } from './indianOceanSites';
import { OCEANIA_COUNTRY_MAP } from './oceaniaSites';
import { EAST_ASIA_COUNTRY_MAP } from './eastAsiaSites';
import { AFRICA_COUNTRY_MAP } from './africaSites';
import { NORTHERN_REGIONS_COUNTRY_MAP } from './northernRegionsSites';

export type { SiteCategory };
export { CATEGORY_META, US_STATES };

// ── World site type (adds country) ────────────────────────────────────────────

export interface WorldSite extends LibrarySite {
  country: string;
}

export interface LibrarySection {
  region: string;
  data: WorldSite[];
}

// ── World regions ─────────────────────────────────────────────────────────────

export interface WorldRegion {
  id: string;
  name: string;
  emoji: string;
  countries: string[];
  // Future: description, coverImageUrl, etc.
}

export const WORLD_REGIONS: WorldRegion[] = [
  {
    id: 'united-states',
    name: 'United States',
    emoji: '🇺🇸',
    countries: ['United States'],
  },
  {
    id: 'caribbean',
    name: 'Caribbean',
    emoji: '🏝️',
    countries: ['Cayman Islands', 'Bahamas', 'Turks & Caicos', 'Jamaica', 'Cuba', 'British Virgin Islands', 'US Virgin Islands', 'Bonaire', 'Curaçao', 'Aruba', 'Dominican Republic', 'Puerto Rico', 'St. Lucia', 'Grenada', 'Dominica', 'Trinidad & Tobago', 'Saba', 'St. Kitts & Nevis', 'Barbados', 'Antigua & Barbuda', 'Bermuda', 'Martinique', 'Guadeloupe', 'St. Vincent & the Grenadines'],
  },
  {
    id: 'central-america',
    name: 'Central America',
    emoji: '🌎',
    countries: ['Mexico', 'Belize', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama'],
  },
  {
    id: 'south-america',
    name: 'South America',
    emoji: '🌊',
    countries: ['Colombia', 'Ecuador', 'Brazil', 'Peru', 'Venezuela', 'Chile', 'Bolivia', 'Argentina', 'Uruguay'],
  },
  {
    id: 'southeast-asia',
    name: 'Southeast Asia',
    emoji: '🐠',
    countries: ['Indonesia', 'Philippines', 'Thailand', 'Malaysia', 'Myanmar', 'Vietnam', 'Cambodia', 'Timor-Leste'],
  },
  {
    id: 'east-asia',
    name: 'East Asia',
    emoji: '🇯🇵',
    countries: ['Japan', 'South Korea', 'Taiwan'],
  },
  {
    id: 'pacific',
    name: 'Pacific Islands',
    emoji: '🌺',
    countries: ['Palau', 'Micronesia', 'Marshall Islands', 'Fiji', 'Solomon Islands', 'Tonga', 'French Polynesia', 'Vanuatu', 'New Caledonia', 'Guam', 'Samoa', 'Cook Islands'],
  },
  {
    id: 'oceania',
    name: 'Australia & Oceania',
    emoji: '🦘',
    countries: ['Australia', 'New Zealand', 'Papua New Guinea'],
  },
  {
    id: 'indian-ocean',
    name: 'Indian Ocean',
    emoji: '🐋',
    countries: ['Maldives', 'Seychelles', 'Mauritius', 'Madagascar', 'Mozambique', 'Tanzania', 'Sri Lanka', 'India', 'Comoros'],
  },
  {
    id: 'red-sea',
    name: 'Red Sea & Middle East',
    emoji: '🏜️',
    countries: ['Egypt', 'Jordan', 'Saudi Arabia', 'Sudan', 'Djibouti', 'Oman', 'Bahrain', 'UAE'],
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    emoji: '🏛️',
    countries: ['Greece', 'Malta', 'Croatia', 'Spain', 'Turkey', 'Italy', 'France', 'Cyprus', 'Portugal', 'Canary Islands'],
  },
  {
    id: 'africa',
    name: 'Africa',
    emoji: '🌍',
    countries: ['South Africa', 'Kenya', 'Cape Verde', 'Senegal', 'Ghana'],
  },
  {
    id: 'northern-regions',
    name: 'Canada & Northern Europe',
    emoji: '❄️',
    countries: ['Canada', 'United Kingdom', 'Iceland', 'Norway', 'Ireland', 'Sweden', 'Denmark'],
  },
];

// ── Build ALL_SITES ───────────────────────────────────────────────────────────

const tagCountry = (map: { sites: LibrarySite[]; country: string }[]): WorldSite[] =>
  map.flatMap(({ sites, country }) => sites.map(s => ({ ...s, country })));

const US_WORLD_SITES: WorldSite[] = US_SITES.map(s => ({ ...s, country: 'United States' }));

export const ALL_SITES: WorldSite[] = [
  ...US_WORLD_SITES,
  ...tagCountry(CARIBBEAN_COUNTRY_MAP),
  ...tagCountry(CENTRAL_AMERICA_COUNTRY_MAP),
  ...tagCountry(SOUTH_AMERICA_COUNTRY_MAP),
  ...tagCountry(SOUTHEAST_ASIA_COUNTRY_MAP),
  ...tagCountry(EAST_ASIA_COUNTRY_MAP),
  ...tagCountry(PACIFIC_COUNTRY_MAP),
  ...tagCountry(OCEANIA_COUNTRY_MAP),
  ...tagCountry(INDIAN_OCEAN_COUNTRY_MAP),
  ...tagCountry(RED_SEA_COUNTRY_MAP),
  ...tagCountry(MEDITERRANEAN_COUNTRY_MAP),
  ...tagCountry(AFRICA_COUNTRY_MAP),
  ...tagCountry(NORTHERN_REGIONS_COUNTRY_MAP),
];

/** Sorted list of countries present in the library (derived from site data). */
export const LIBRARY_COUNTRIES: string[] = [...new Set(ALL_SITES.map(s => s.country))].sort();

/** Total site count — shown on the Sites tab banner. */
export const LIBRARY_SITE_COUNT = ALL_SITES.length;

// ── Helper lookups ────────────────────────────────────────────────────────────

/** Returns the WorldRegion that contains a given country. */
export function getRegionForCountry(country: string): WorldRegion | undefined {
  return WORLD_REGIONS.find(r => r.countries.includes(country));
}

/**
 * Returns countries that actually have sites in the library for a given region.
 * (Skips countries listed in WORLD_REGIONS but not yet in the data.)
 */
export function getCountriesForRegion(regionId: string): string[] {
  const region = WORLD_REGIONS.find(r => r.id === regionId);
  if (!region) return [];
  return [
    ...new Set(
      ALL_SITES
        .filter(s => region.countries.includes(s.country))
        .map(s => s.country),
    ),
  ].sort();
}

/** Returns states/provinces with sites for a given country. */
export function getStatesForCountry(country: string): string[] {
  return [
    ...new Set(
      ALL_SITES
        .filter(s => s.country === country)
        .map(s => s.state),
    ),
  ].sort();
}

/** User-facing label for the state/area row based on country. */
export function getAreaLabel(country: string): string {
  if (country === 'United States') return 'STATE';
  if (country === 'Mexico' || country === 'Honduras') return 'DEPARTMENT';
  return 'AREA';
}

// ── Master grouping function ──────────────────────────────────────────────────

/**
 * Three-level grouping for the browse screen:
 *
 *   selectedRegionId=null           → section per world region
 *   regionId set, no country        → section per country  (multi-country region)
 *                                   → section per state    (single-country region like US)
 *   regionId + effectiveCountry     → section per state/province
 *   regionId + country + state      → section per sub-region
 */
export function groupForLibrary(
  sites: WorldSite[],
  selectedRegionId: string | null,
  effectiveCountry: string | null,
  selectedState: string | null,
): LibrarySection[] {

  // ── No region: group by world region name ─────────────────────────────────
  if (!selectedRegionId) {
    const map = new Map<string, WorldSite[]>();
    for (const s of sites) {
      const region = getRegionForCountry(s.country);
      const key = region?.name ?? s.country;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([region, data]) => ({ region, data }));
  }

  const currentRegion = WORLD_REGIONS.find(r => r.id === selectedRegionId);
  const isSingleCountry = (currentRegion?.countries.length ?? 0) === 1;

  // ── Single-country region (US): skip to state grouping ───────────────────
  if (isSingleCountry && !selectedState) {
    const map = new Map<string, WorldSite[]>();
    for (const s of sites) {
      const key = s.state || s.region;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([region, data]) => ({ region, data }));
  }

  // ── Multi-country region, no country selected: group by country ──────────
  if (!effectiveCountry) {
    const map = new Map<string, WorldSite[]>();
    for (const s of sites) {
      if (!map.has(s.country)) map.set(s.country, []);
      map.get(s.country)!.push(s);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, data]) => ({ region: country, data }));
  }

  // ── Country selected, no state: group by state/province ─────────────────
  if (!selectedState) {
    const map = new Map<string, WorldSite[]>();
    for (const s of sites) {
      const key = s.state || s.region;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([region, data]) => ({ region, data }));
  }

  // ── Country + state: group by sub-region ────────────────────────────────
  const map = new Map<string, WorldSite[]>();
  for (const s of sites) {
    if (!map.has(s.region)) map.set(s.region, []);
    map.get(s.region)!.push(s);
  }

  // Florida has a preferred region order
  if (effectiveCountry === 'United States' && selectedState === 'Florida') {
    const order = [
      'North Florida', 'Central Florida', 'Southeast Florida',
      'Florida Keys', 'Gulf Coast', 'Northeast Florida', 'Panhandle',
    ];
    return order
      .filter(r => map.has(r))
      .map(region => ({ region, data: map.get(region)! }));
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([region, data]) => ({ region, data }));
}
