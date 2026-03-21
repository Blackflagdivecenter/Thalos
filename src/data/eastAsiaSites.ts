/**
 * East Asia Dive Site Library
 *
 * Covers: Japan, South Korea, Taiwan.
 */

import { LibrarySite } from './usSites';

// ── Japan ────────────────────────────────────────────────────────────────────
const JAPAN_SITES: LibrarySite[] = [
  {
    name: 'Yonaguni Monument',
    location: 'Yonaguni Island, Okinawa, Japan',
    region: 'Okinawa',
    state: 'Okinawa',
    category: 'reef',
    latitude: 24.435, longitude: 123.012,
    maxDepthMeters: 30,
    description: "One of the most mysterious underwater structures in the world — a massive stepped stone formation discovered in 1987 that some researchers believe is a 10,000-year-old man-made monument (predating the Egyptian pyramids), while others argue it is natural sandstone erosion. Whatever its origin, the monument is a stunning dive: enormous terraced platforms, right-angle steps, pillars, and what appear to be carved channels extending across a vast area at 5–25 m depth. Scalloped hammerhead sharks aggregate around Yonaguni in winter (November–February), adding big animal encounters to the archaeological mystery.",
    conditions: 'Strong current possible. Visibility 40–100 ft. 72–82°F (seasonal). Intermediate to advanced.',
    accessNotes: 'Fly to Yonaguni (OGN) from Naha, Okinawa or Ishigaki. A couple of dive operators on the island. Best November–February for hammerheads. Japan\'s westernmost inhabited island.',
  },
  {
    name: 'Kerama Islands',
    location: 'Kerama Islands, Okinawa, Japan',
    region: 'Okinawa',
    state: 'Okinawa',
    category: 'reef',
    latitude: 26.200, longitude: 127.300,
    maxDepthMeters: 30,
    description: "A national park archipelago 40 km west of Naha with some of the clearest water in Japan — visibility regularly exceeds 100 ft, earning the local water the name 'Kerama Blue.' The islands support healthy coral gardens with over 250 coral species, green and hawksbill sea turtles on nearly every dive, manta rays (seasonal), humpback whales (January–March), and the endemic Kerama deer. The combination of crystal-clear warm water, turtle encounters, and easy access from Okinawa's main island makes the Keramas one of Japan's best dive destinations.",
    conditions: 'Calm in summer. Visibility 60–130 ft. 72–82°F. Mild current. All skill levels.',
    accessNotes: 'Ferry from Naha, Okinawa (~50 min to Zamami or Tokashiki). Day trips possible. Accommodation on the islands. Best June–September for warm water; January–March for humpback whales.',
  },
  {
    name: 'Osezaki — Izu Peninsula',
    location: 'Osezaki, Numazu, Shizuoka, Japan',
    region: 'Izu Peninsula',
    state: 'Shizuoka',
    category: 'shore',
    latitude: 35.010, longitude: 138.790,
    maxDepthMeters: 30,
    description: "The most popular dive site in mainland Japan — a cape on the western Izu Peninsula where the warm Kuroshio Current brings tropical species within a 2-hour drive of Tokyo. The site is famous for its diversity: soft corals, nudibranchs (Japan is a nudibranch hotspot), seahorses, frogfish, mandarin fish, and visiting whale sharks and manta rays. A long underwater canyon provides dramatic topography. Night dives reveal flashlight fish and bobtail squid. The combination of macro life, easy access, and the chance for big animal surprises makes Osezaki Japan's most versatile dive site.",
    conditions: 'Shore entry. Visibility 15–60 ft (varies). 60–79°F (seasonal). All skill levels.',
    accessNotes: 'Drive from Tokyo (~2 hrs) or train to Numazu station then taxi. Several operators. Year-round diving. Weekends can be crowded. Best July–October for warmest water.',
  },
  {
    name: 'Ogasawara (Bonin) Islands',
    location: 'Ogasawara Village, Tokyo, Japan',
    region: 'Ogasawara',
    state: 'Tokyo',
    category: 'reef',
    latitude: 27.100, longitude: 142.200,
    maxDepthMeters: 30,
    description: "Japan's most remote inhabited territory — the Ogasawara (Bonin) Islands are a UNESCO World Heritage site 1,000 km south of Tokyo with subtropical marine life, humpback whales (February–April), dolphins, and endemic species. The islands' isolation has produced unique marine communities. Sperm whales, hammerhead sharks, and massive schools of pelagic fish are encountered on deeper dives. Swimming with wild dolphins in the clear subtropical water is a signature experience. Often compared to the Galápagos for its endemic species and frontier diving feel — accessible only by a 24-hour ferry from Tokyo.",
    conditions: 'Open ocean, some current. Visibility 40–100 ft. 72–82°F. Intermediate.',
    accessNotes: 'Ferry from Tokyo to Chichijima — 24 hours, runs roughly weekly. No flights. Minimum 6-night stay (ferry schedule). Small dive operators on Chichijima. A genuine expedition.',
  },
];

// ── South Korea ──────────────────────────────────────────────────────────────
const SOUTH_KOREA_SITES: LibrarySite[] = [
  {
    name: 'Jeju Island — Seogwipo',
    location: 'Seogwipo, Jeju Island, South Korea',
    region: 'Jeju Island',
    state: 'Jeju',
    category: 'reef',
    latitude: 33.240, longitude: 126.560,
    maxDepthMeters: 25,
    description: "South Korea's best diving destination — a volcanic island with dramatic underwater topography: lava arches, tunnels, and columnar basalt formations that continue underwater from the famous above-water formations. The Jungmun coast features a series of arches and swimthroughs in volcanic rock. Soft corals, nudibranchs, octopus, and schools of yellowtail populate the reefs. The famous haenyeo — Korean female free-divers who harvest seafood using traditional breath-hold techniques — have been diving here for centuries and are a UNESCO Intangible Cultural Heritage.",
    conditions: 'Variable — seasonal. Visibility 15–60 ft. 55–77°F (cold in winter). Some current. Intermediate.',
    accessNotes: 'Fly to Jeju (CJU) from Seoul or Busan. Dive operators in Seogwipo and along the south coast. Best July–October (warmest, clearest). Wetsuit thickness varies by season.',
  },
];

// ── Taiwan ───────────────────────────────────────────────────────────────────
const TAIWAN_SITES: LibrarySite[] = [
  {
    name: 'Green Island (Lüdao)',
    location: 'Green Island, Taitung, Taiwan',
    region: 'Taitung Coast',
    state: 'Taitung',
    category: 'reef',
    latitude: 22.660, longitude: 121.480,
    maxDepthMeters: 30,
    description: "Taiwan's premier dive destination — a small volcanic island in the warm Kuroshio Current with dramatic underwater topography and exceptional marine biodiversity. The Big Mushroom Coral — a single massive Porites coral colony estimated at over 1,000 years old and 12 m across — is the island's signature attraction and one of the largest coral colonies in the world. The walls and slopes support dense hard coral, sea turtles (green and hawksbill), hammerhead sharks (winter), and a remarkable diversity of nudibranchs and reef fish. Clean, warm water and excellent visibility.",
    conditions: 'Some current. Visibility 40–100 ft. 75–84°F. All skill levels on many sites.',
    accessNotes: 'Fly from Taitung to Green Island (~15 min) or ferry (~50 min). Dive operators on the island. Best April–October. Accommodation available.',
  },
  {
    name: 'Orchid Island (Lanyu)',
    location: 'Orchid Island, Taitung, Taiwan',
    region: 'Taitung Coast',
    state: 'Taitung',
    category: 'reef',
    latitude: 22.040, longitude: 121.550,
    maxDepthMeters: 30,
    description: "Taiwan's most remote inhabited island — home to the indigenous Tao people and their distinctive flying fish culture. The underwater world is as remarkable as the above-water culture: pristine coral reefs, dramatic volcanic rock formations, large schools of trevally and barracuda, sea turtles, and the occasional passing hammerhead. The waters are among the clearest in Taiwan and the reefs are in excellent condition due to the island's remoteness and small population. A culturally immersive and ecologically rich dive destination.",
    conditions: 'Open ocean, some current and swell. Visibility 40–100 ft. 75–84°F. Intermediate.',
    accessNotes: 'Fly from Taitung (~30 min) or ferry (~2.5 hrs). Limited dive infrastructure. Best April–September. Respect Tao cultural practices and restricted areas.',
  },
];

// ── Combined export ──────────────────────────────────────────────────────────

export const EAST_ASIA_SITES: LibrarySite[] = [
  ...JAPAN_SITES,
  ...SOUTH_KOREA_SITES,
  ...TAIWAN_SITES,
];

export const EAST_ASIA_COUNTRY_MAP: { sites: LibrarySite[]; country: string }[] = [
  { sites: JAPAN_SITES,        country: 'Japan'        },
  { sites: SOUTH_KOREA_SITES,  country: 'South Korea'  },
  { sites: TAIWAN_SITES,       country: 'Taiwan'       },
];
