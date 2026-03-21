/**
 * Northern Regions Dive Site Library
 *
 * Covers: Canada, United Kingdom, Iceland, Norway, Ireland,
 * Sweden, Denmark.
 */

import { LibrarySite } from './usSites';

// ── Canada ───────────────────────────────────────────────────────────────────
const CANADA_SITES: LibrarySite[] = [
  {
    name: 'HMCS Yukon Wreck — British Columbia',
    location: 'San Diego (border) / Victoria, British Columbia, Canada',
    region: 'Pacific Coast',
    state: 'British Columbia',
    category: 'wreck',
    latitude: 48.880, longitude: -123.370,
    maxDepthMeters: 30,
    description: "British Columbia's emerald-green waters offer some of the best cold-water diving in the world. The Glass Sponge Reefs — unique to BC and made of the same organisms that built reefs in the Jurassic — are a living relic found nowhere else on Earth. Giant Pacific octopus (the world's largest octopus species), wolf eels with their fearsome faces but gentle dispositions, Steller sea lions, enormous lingcod, and vibrant anemone gardens. The cold, nutrient-rich water produces extraordinary invertebrate diversity. Jacques Cousteau called BC his second-favorite dive destination.",
    conditions: 'Cold 7–12°C — drysuit recommended. Visibility 20–60 ft. Current on many sites. Intermediate to advanced.',
    accessNotes: 'Dive operators in Vancouver, Victoria, Nanaimo, and Campbell River. Year-round diving. Best October–April for plankton-free visibility. Giant Pacific octopus year-round.',
  },
  {
    name: 'Bell Island Wrecks — Newfoundland',
    location: 'Bell Island, Newfoundland, Canada',
    region: 'Atlantic Coast',
    state: 'Newfoundland',
    category: 'wreck',
    latitude: 47.633, longitude: -52.940,
    maxDepthMeters: 30,
    description: "Four WWII cargo ships sunk by German U-boat torpedoes in 1942 — the only location in North America where enemy action sank ships within sight of the shore. The SS Rose Castle, SS Saganaga, SS Lord Strathcona, and PLM-27 lie in 20–30 m of cold, clear water. The wrecks are intact and in excellent condition, encrusted with anemones, sea urchins, and cold-water corals. The historical significance — German U-boats operating in Canadian waters — is remarkable. Diving these wrecks in the cold, dark Atlantic with the knowledge of their violent history is powerful.",
    conditions: 'Cold 0–10°C — drysuit essential. Visibility 20–60 ft. Some current. Intermediate to advanced.',
    accessNotes: 'Ferry from Portugal Cove to Bell Island (~20 min). Dive operators in St. John\'s. Best June–October. Very cold — thermal protection critical.',
  },
  {
    name: 'Tobermory — Fathom Five National Marine Park',
    location: 'Tobermory, Ontario, Canada',
    region: 'Great Lakes',
    state: 'Ontario',
    category: 'wreck',
    latitude: 45.254, longitude: -81.666,
    maxDepthMeters: 25,
    description: "Canada's first national marine conservation area — the treacherous waters around the Bruce Peninsula have claimed over 20 ships since the 1880s. The cold, fresh water of Lake Huron has preserved the wooden-hulled schooners in extraordinary condition — masts, rigging, and even cabin furniture are still intact. The Sweepstakes and City of Grand Rapids are the most popular dives — visible from the surface in the crystal-clear water. The combination of intact wooden shipwrecks, exceptional freshwater visibility (sometimes 60+ ft), and the grotto cave systems makes Tobermory uniquely special.",
    conditions: 'Cold freshwater 4–18°C. Visibility 20–80 ft (excellent for freshwater). All skill levels on shallow wrecks.',
    accessNotes: 'Drive from Toronto (~3.5 hrs). Multiple operators in Tobermory. Best June–September. Wetsuits or drysuits depending on season. Glass-bottom boat tours for non-divers.',
  },
];

// ── United Kingdom ───────────────────────────────────────────────────────────
const UK_SITES: LibrarySite[] = [
  {
    name: 'Scapa Flow — Orkney',
    location: 'Orkney Islands, Scotland, UK',
    region: 'Scotland',
    state: 'Scotland',
    category: 'wreck',
    latitude: 58.890, longitude: -3.100,
    maxDepthMeters: 45,
    description: "The greatest wreck diving destination in Europe and one of the finest in the world. In 1919, the interned German High Seas Fleet — 74 warships — was scuttled by their crews in Scapa Flow rather than be surrendered to the Allies. Seven major warships remain on the seabed: three battleships (König, Kronprinz Wilhelm, Markgraf) and four light cruisers. These are enormous vessels — the battleships are 175 m long. The wrecks lie in 12–45 m in the sheltered Flow. The scale, the history, and the sheer number of accessible WWI capital ships make Scapa Flow a wreck diver's pilgrimage.",
    conditions: 'Cold 6–12°C. Visibility 15–40 ft. Current (tide dependent). Intermediate to advanced. Drysuit essential.',
    accessNotes: 'Fly to Kirkwall (KOI) or ferry from Scottish mainland. Several specialist wreck dive operators. Best May–September. Weeklong dive packages typical.',
  },
  {
    name: 'Farne Islands — Seal Colony',
    location: 'Seahouses, Northumberland, England, UK',
    region: 'Northeast England',
    state: 'England',
    category: 'reef',
    latitude: 55.630, longitude: -1.620,
    maxDepthMeters: 20,
    description: "A chain of rocky islands off Northumberland's coast that host one of the largest grey seal colonies in England — over 4,000 animals. Diving with the seals in autumn and winter (September–January) is one of the UK's great underwater experiences: curious juvenile seals approach divers, mouth regulators, pull fins, and perform barrel-rolls at arm's length. The kelp-covered rocky reefs support rich temperate marine life: dead man's fingers soft corals, anemones, lobster, and nudibranchs. The Farne Islands are also famous for their seabird colonies (puffins, terns, guillemots).",
    conditions: 'Cold 7–14°C. Visibility 10–30 ft. Some current and swell. Intermediate. Drysuit recommended.',
    accessNotes: 'Boat from Seahouses (~15 min). Several operators. Best September–January for seal interactions. Accessible from Newcastle (~90 min drive).',
  },
  {
    name: 'Lundy Island Marine Conservation Zone',
    location: 'Lundy Island, Devon, England, UK',
    region: 'Southwest England',
    state: 'England',
    category: 'reef',
    latitude: 51.170, longitude: -4.670,
    maxDepthMeters: 30,
    description: "England's first Marine Conservation Zone and home to the country's only No Take Zone — where decades of protection have produced stunning marine life recovery. Grey seals, blue sharks (summer), basking sharks (summer), conger eels, lobster, and the UK's healthiest communities of pink sea fans and jewel anemones. The rocky underwater topography — gullies, pinnacles, and walls — supports vibrant temperate reef communities. The combination of protected waters, diverse marine life, and dramatic Bristol Channel scenery makes Lundy the UK's finest reef diving destination.",
    conditions: 'Variable — exposed to Atlantic swell. Visibility 10–40 ft. Cold 8–16°C. Current. Intermediate to advanced.',
    accessNotes: 'Boat from Ilfracombe or Bideford, Devon, or stay on Lundy (Landmark Trust accommodation). Dive charters from Devon. Best May–September.',
  },
];

// ── Iceland ──────────────────────────────────────────────────────────────────
const ICELAND_SITES: LibrarySite[] = [
  {
    name: 'Silfra — Thingvellir',
    location: 'Þingvellir National Park, Iceland',
    region: 'Golden Circle',
    state: 'Capital Region',
    category: 'spring',
    latitude: 64.256, longitude: -21.116,
    maxDepthMeters: 18,
    description: "The most famous freshwater dive site in the world — a fissure between the North American and Eurasian tectonic plates filled with glacial water filtered through lava rock for 30–100 years. The result is the clearest natural water on Earth: visibility exceeds 300 ft, creating an illusion of floating in air above the rocky bottom. The water is 2–4°C year-round but the clarity is so extraordinary that it redefines what a diver thinks is possible. Silfra is a UNESCO World Heritage site within Þingvellir National Park. There is no comparable experience in diving.",
    conditions: 'Cold 2–4°C — drysuit mandatory. Visibility 300+ ft (unmatched anywhere). No current. All skill levels with drysuit certification.',
    accessNotes: 'Drive from Reykjavik (~45 min). Several operators run daily trips. Drysuit provided or bring your own. Year-round but book ahead. Part of the Golden Circle tourist route.',
  },
];

// ── Norway ───────────────────────────────────────────────────────────────────
const NORWAY_SITES: LibrarySite[] = [
  {
    name: 'Lofoten Islands — Orca & Kelp',
    location: 'Lofoten, Nordland, Norway',
    region: 'Northern Norway',
    state: 'Nordland',
    category: 'reef',
    latitude: 68.200, longitude: 14.500,
    maxDepthMeters: 25,
    description: "Arctic Norway's dramatic fjords and islands offer some of the world's most atmospheric cold-water diving. Towering kelp forests sway in the current, cold-water corals (including deep-water coral reefs unique to Norway) encrust the walls, and king crabs, wolf fish, and nudibranchs populate the rocky seabed. From October to January, orca (killer whales) follow herring into the fjords — snorkeling and diving with wild orca in the dark Arctic winter, with the Northern Lights overhead, is one of the most extraordinary experiences available to a diver. Sea eagles soar above the surface.",
    conditions: 'Cold 4–12°C — drysuit essential. Visibility 15–40 ft. Some current in sounds. Intermediate. Dark in winter.',
    accessNotes: 'Fly to Svolvær (SVJ) or Bodø (BOO). Dive operators and orca safari operators in Lofoten. Orca season October–January. Summer diving for kelp forests and midnight sun. Very cold — proper thermal protection critical.',
  },
  {
    name: 'Gulen — Cold Water Diving Capital',
    location: 'Gulen, Vestland, Norway',
    region: 'Western Norway',
    state: 'Vestland',
    category: 'reef',
    latitude: 61.030, longitude: 5.020,
    maxDepthMeters: 30,
    description: "Self-proclaimed 'cold water diving capital of the world' — Gulen's fjords at the mouth of the Sognefjorden (the world's longest fjord) offer extraordinary marine life in crystal-clear Norwegian water. Nudibranch species by the dozen, enormous wolf fish in their dens, forests of deepwater coral, sea pens swaying on sandy slopes, and vibrant anemone-covered walls. The annual Nudibranch Safari competition draws underwater photographers from across Europe. Gulen represents what temperate/cold water diving can be at its absolute best.",
    conditions: 'Cold 4–14°C. Visibility 20–60 ft. Mild current. Intermediate. Drysuit essential.',
    accessNotes: 'Drive from Bergen (~2.5 hrs). Gulen Dive Resort is the primary operator. Year-round diving. Best March–June for nudibranch diversity.',
  },
];

// ── Ireland ────────────────────────────────────────────────────────────────
const IRELAND_SITES: LibrarySite[] = [
  {
    name: 'Malin Head — Ireland\'s Northernmost Dive',
    location: 'Malin Head, County Donegal, Ireland',
    region: 'Wild Atlantic Way',
    state: 'Donegal',
    category: 'reef',
    latitude: 55.380, longitude: -7.370,
    maxDepthMeters: 30,
    description: "Ireland's northernmost point and one of Europe's most dramatic cold-water dive locations. The Atlantic coastline features kelp forests, dramatic rock arches, and swimthroughs carved by millennia of Atlantic storms. The nutrient-rich waters support dense marine life: blue sharks (summer), basking sharks (May–August), grey seals, enormous conger eels, wolf fish, and brilliantly colorful jewel anemones and nudibranchs on every surface. Several WWII convoy wrecks lie offshore. The Wild Atlantic Way coastline from Malin Head to the Aran Islands offers some of the most atmospheric diving in Europe.",
    conditions: 'Cold 8–14°C — drysuit essential. Visibility 10–40 ft. Swell and current common. Intermediate to advanced.',
    accessNotes: 'Drive from Derry/Londonderry (~1.5 hrs). Local dive operators in Malin and Greencastle. Best June–September. Combine with the Wild Atlantic Way coastal drive.',
  },
];

// ── Sweden ─────────────────────────────────────────────────────────────────
const SWEDEN_SITES: LibrarySite[] = [
  {
    name: 'Gothenburg Archipelago Wrecks',
    location: 'Gothenburg, Västra Götaland, Sweden',
    region: 'West Coast',
    state: 'Västra Götaland',
    category: 'wreck',
    latitude: 57.690, longitude: 11.930,
    maxDepthMeters: 30,
    description: "Sweden's west coast offers Scandinavia's best accessible wreck diving — the busy shipping lanes off Gothenburg have claimed hundreds of vessels over the centuries. The cold, low-salinity water of the Skagerrak and Kattegat preserves wooden wrecks in remarkable condition. Historic sailing vessels, WWII-era ships, and modern artificial reefs are all accessible. The rocky coastline supports cold-water marine life: lobster, edible crabs, dead man's fingers soft coral, and dense fields of anemones and nudibranchs. Night diving reveals spectacular bioluminescence in autumn.",
    conditions: 'Cold 4–16°C — drysuit essential. Visibility 10–40 ft. Some current. Intermediate.',
    accessNotes: 'Dive operators in Gothenburg and along the Bohuslän coast. Fly to Gothenburg (GOT). Year-round diving. Best May–October for warmer water and better visibility.',
  },
];

// ── Denmark ────────────────────────────────────────────────────────────────
const DENMARK_SITES: LibrarySite[] = [
  {
    name: 'Øresund — The Sound',
    location: 'Øresund Strait, Copenhagen, Denmark',
    region: 'Zealand',
    state: 'Capital Region',
    category: 'reef',
    latitude: 55.700, longitude: 12.650,
    maxDepthMeters: 20,
    description: "The narrow strait between Denmark and Sweden is a unique marine environment where the salty North Sea meets the brackish Baltic, creating a mixing zone with unusual biodiversity. The rocky reefs support both saltwater and brackish-water species side by side. Cod, flatfish, lobster, and large populations of jellyfish inhabit the strait. Numerous wrecks — from Viking-era vessels to WWII ships — lie on the seabed. The combination of easy access from Copenhagen, good infrastructure, and the unusual Atlantic-Baltic transition ecosystem makes Øresund Denmark's most popular dive area.",
    conditions: 'Cold 4–18°C. Visibility 10–30 ft (varies). Current in the strait. Drysuit essential. All skill levels on sheltered sites.',
    accessNotes: 'Shore and boat dives from Copenhagen or Helsingør. Multiple clubs and operators. Easy access by public transport. Year-round diving. Best June–September.',
  },
];

// ── Combined export ──────────────────────────────────────────────────────────

export const NORTHERN_REGIONS_SITES: LibrarySite[] = [
  ...CANADA_SITES,
  ...UK_SITES,
  ...ICELAND_SITES,
  ...NORWAY_SITES,
  ...IRELAND_SITES,
  ...SWEDEN_SITES,
  ...DENMARK_SITES,
];

export const NORTHERN_REGIONS_COUNTRY_MAP: { sites: LibrarySite[]; country: string }[] = [
  { sites: CANADA_SITES,   country: 'Canada'         },
  { sites: UK_SITES,       country: 'United Kingdom'  },
  { sites: ICELAND_SITES,  country: 'Iceland'         },
  { sites: NORWAY_SITES,   country: 'Norway'          },
  { sites: IRELAND_SITES,  country: 'Ireland'         },
  { sites: SWEDEN_SITES,   country: 'Sweden'          },
  { sites: DENMARK_SITES,  country: 'Denmark'         },
];
