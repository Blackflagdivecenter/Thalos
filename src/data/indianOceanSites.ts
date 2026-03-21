/**
 * Indian Ocean Dive Site Library
 *
 * Covers: Maldives, Seychelles, Mauritius, Madagascar,
 * Mozambique, Tanzania, Sri Lanka, Réunion.
 */

import { LibrarySite } from './usSites';

// ── Maldives ─────────────────────────────────────────────────────────────────
const MALDIVES_SITES: LibrarySite[] = [
  {
    name: 'South Ari Atoll — Whale Shark Capital',
    location: 'South Ari Atoll, Maldives',
    region: 'Ari Atoll',
    state: 'Ari Atoll',
    category: 'reef',
    latitude: 3.500, longitude: 72.800,
    maxDepthMeters: 30,
    description: "The best place in the world for year-round whale shark encounters. South Ari Atoll hosts a resident population of juvenile whale sharks that feed along the atoll rim. Unlike seasonal destinations, whale sharks can be found here on nearly any day of the year. Snorkelers and divers observe these gentle giants from the surface as they filter-feed in the warm, clear Maldivian water. The surrounding reef is pristine — manta rays, grey reef sharks, eagle rays, and dense schools of fusiliers and snappers. Multiple luxury resorts and liveaboards service the atoll.",
    conditions: 'Calm atoll. Visibility 40–100 ft. 82–86°F. Mild current in channels. All skill levels for whale shark snorkeling.',
    accessNotes: 'Speedboat or seaplane from Malé (MLE) to South Ari resorts. Many liveaboards include South Ari. Whale sharks year-round, peak season June–November.',
  },
  {
    name: 'Hanifaru Bay — Manta Ray Aggregation',
    location: 'Baa Atoll, Maldives',
    region: 'Baa Atoll',
    state: 'Baa Atoll',
    category: 'reef',
    latitude: 5.305, longitude: 73.053,
    maxDepthMeters: 10,
    description: "A UNESCO Biosphere Reserve and the site of the largest known feeding aggregation of manta rays in the world. During the southwest monsoon (June–November), tidal currents funnel plankton into Hanifaru Bay, attracting up to 200 reef manta rays that feed in a spectacular chain-feeding frenzy — rolling, spiraling, and barrel-rolling through the plankton clouds. Whale sharks also join the aggregation. Snorkel only (no scuba permitted in the bay). Seeing 100+ mantas feeding simultaneously in a bay the size of a football field is one of the great natural spectacles on Earth.",
    conditions: 'Shallow bay. Visibility 20–60 ft. 82–86°F. Snorkel only. All skill levels.',
    accessNotes: 'Seaplane or speedboat from Malé to Baa Atoll resorts. Hanifaru Bay strictly regulated — snorkel only, limited entries per day, no scuba. June–November for aggregations.',
  },
  {
    name: 'North Malé Atoll — Channels',
    location: 'North Malé Atoll, Maldives',
    region: 'North Malé',
    state: 'North Malé Atoll',
    category: 'reef',
    latitude: 4.300, longitude: 73.500,
    maxDepthMeters: 30,
    description: "The most accessible atoll from the capital Malé — home to classic Maldivian channel dives that define the destination's underwater experience. Channels (kandus) cut through the atoll rim, funneling current and concentrating marine life. Grey reef sharks, whitetip reef sharks, Napoleon wrasse, eagle rays, and manta rays at cleaning stations. The overhangs inside the channels are decorated with soft corals, fan corals, and dense anemone gardens. HP Reef (Rainbow Reef) is the most photographed site. The proximity to Malé means easy access for short trips.",
    conditions: 'Current in channels (drift diving). Visibility 40–100 ft. 82–86°F. Intermediate on channel dives.',
    accessNotes: 'Speedboat from Malé (~30–60 min). Many resorts and guesthouses. Also liveaboard base for longer itineraries. Year-round diving.',
  },
];

// ── Seychelles ───────────────────────────────────────────────────────────────
const SEYCHELLES_SITES: LibrarySite[] = [
  {
    name: 'Aldabra Atoll',
    location: 'Aldabra Group, Seychelles (1,100 km from Mahé)',
    region: 'Outer Islands',
    state: 'Aldabra Group',
    category: 'reef',
    latitude: -9.420, longitude: 46.380,
    maxDepthMeters: 30,
    description: "A UNESCO World Heritage site and one of the most remote, pristine atolls on Earth — 1,100 km from the Seychelles' main islands. Aldabra is best known for its 100,000+ giant tortoises (the largest population in the world), but the underwater world is equally extraordinary: healthy coral reefs, manta rays, reef sharks, large grouper, hawksbill and green turtles, and spinner dolphins. The channels cutting through the atoll create powerful drift dives with exceptional pelagic encounters. Few divers have ever visited — this is genuine wilderness diving.",
    conditions: 'Remote, exposed. Current in channels. Visibility 40–100 ft. 82–86°F. Intermediate to advanced.',
    accessNotes: 'Expedition liveaboard or private yacht only — no commercial access to Aldabra. Special permit from the Seychelles Islands Foundation required. Extremely limited annual visitors. Expeditions typically run 10–14 days from Mahé. Book 1–2 years ahead.',
  },
  {
    name: 'Mahé — Beau Vallon Bay & Granite Reefs',
    location: 'Mahé, Seychelles',
    region: 'Inner Islands',
    state: 'Mahé',
    category: 'reef',
    latitude: -4.600, longitude: 55.430,
    maxDepthMeters: 25,
    description: "The Seychelles' main island offers distinctive diving around massive granite boulders — the same ancient Gondwanan granite formations that define the islands' above-water scenery continue underwater, creating dramatic swimthroughs, overhangs, and channels. Whale sharks visit the inner islands seasonally (August–November), along with hawksbill turtles, eagle rays, octopus, and the typical Indian Ocean reef fish community. The granite underwater landscape is unique — the smooth, rounded boulders draped in corals and sponges are unlike any other dive environment in the tropics.",
    conditions: 'Generally calm on the west coast. Visibility 20–60 ft. 79–86°F. All skill levels.',
    accessNotes: 'Fly to Mahé (SEZ). Dive operators in Beau Vallon and around the coast. Whale shark season August–November. Also day trips to nearby Praslin and La Digue islands.',
  },
];

// ── Mauritius ────────────────────────────────────────────────────────────────
const MAURITIUS_SITES: LibrarySite[] = [
  {
    name: 'Flic-en-Flac — Cathedral',
    location: 'Flic-en-Flac, Mauritius',
    region: 'West Coast',
    state: 'Black River',
    category: 'reef',
    latitude: -20.300, longitude: 57.360,
    maxDepthMeters: 30,
    description: "Mauritius' most famous dive site — a stunning underwater cavern system where light pours through openings in the rock ceiling, creating cathedral-like light shafts in the blue water. The main chamber is large enough for several divers to hover inside, surrounded by encrusting sponges, soft corals, and schooling glassfish. Outside, the reef slope hosts moray eels, lionfish, turtles, and the occasional passing whale (humpbacks migrate past September–November). The west coast's calm conditions and warm water make this accessible year-round.",
    conditions: 'Calm, sheltered. Visibility 30–80 ft. 75–84°F. Mild current. Intermediate (overhead environment).',
    accessNotes: 'Boat from Flic-en-Flac beach (~10 min). Several operators. Fly to Mauritius (MRU). West coast best June–November.',
  },
];

// ── Madagascar ───────────────────────────────────────────────────────────────
const MADAGASCAR_SITES: LibrarySite[] = [
  {
    name: 'Nosy Be & Nosy Tanikely',
    location: 'Nosy Be, Diana Region, Madagascar',
    region: 'Nosy Be',
    state: 'Diana',
    category: 'reef',
    latitude: -13.330, longitude: 48.250,
    maxDepthMeters: 25,
    description: "Madagascar's premier dive destination — an island off the northwest coast with warm, productive waters fed by the Mozambique Channel. Nosy Tanikely Marine Reserve protects a coral reef with excellent fish density: green turtles on every dive, seahorses, nudibranchs, reef sharks, and occasional whale sharks and humpback whales (September–November). The combination of Madagascar's unique above-water biodiversity (lemurs, chameleons) and good reef diving makes Nosy Be an appealing dual-purpose destination. Far less developed than Indian Ocean alternatives.",
    conditions: 'Calm in season. Visibility 20–60 ft. 79–84°F. Mild current. All skill levels.',
    accessNotes: 'Fly to Nosy Be (NOS) from Antananarivo or direct from some international cities. Dive operators on Nosy Be. Best April–November (dry season). Basic to mid-range accommodation.',
  },
];

// ── Mozambique ───────────────────────────────────────────────────────────────
const MOZAMBIQUE_SITES: LibrarySite[] = [
  {
    name: 'Tofo Beach — Megafauna Capital',
    location: 'Praia do Tofo, Inhambane, Mozambique',
    region: 'Inhambane Province',
    state: 'Inhambane',
    category: 'reef',
    latitude: -23.850, longitude: 35.540,
    maxDepthMeters: 30,
    description: "One of the world's premier destinations for encountering ocean megafauna — whale sharks, manta rays, humpback whales, and dolphins are encountered regularly on 'ocean safaris.' The warm Agulhas Current brings nutrients that attract whale sharks year-round (peak October–March) and manta rays in large numbers. Reef dives at Manta Reef feature cleaning stations where 10+ mantas may be present simultaneously. The sandy slopes also harbor devil rays, guitar sharks, and leopard sharks. Budget-friendly and uncrowded — Tofo offers world-class big animal encounters without the price tag of the Maldives.",
    conditions: 'Surge and current possible. Visibility 20–80 ft. 75–82°F. Intermediate on open water dives.',
    accessNotes: 'Fly to Inhambane (INH) or drive from Maputo (~6 hrs). Budget accommodation in Tofo village. Several dive operators. Year-round but best October–March for whale sharks.',
  },
  {
    name: 'Bazaruto Archipelago',
    location: 'Bazaruto, Inhambane, Mozambique',
    region: 'Bazaruto Archipelago',
    state: 'Inhambane',
    category: 'reef',
    latitude: -21.600, longitude: 35.470,
    maxDepthMeters: 25,
    description: "A national marine park protecting the largest remaining population of dugongs in the East African coast — this gentle, endangered species is encountered surprisingly often in the seagrass meadows around the islands. The archipelago's reefs host green and loggerhead turtles, dolphins, whale sharks, manta rays, and healthy coral. The combination of white sand islands, turquoise water, and dugong encounters makes Bazaruto one of the most exclusive dive destinations in Africa. Several luxury lodges operate on the islands.",
    conditions: 'Variable — calm inside the archipelago. Visibility 20–60 ft. 75–82°F. All skill levels inside.',
    accessNotes: 'Light aircraft from Vilankulo to Bazaruto island lodges. Luxury lodges with dive operations. Expensive but spectacular. Best May–November.',
  },
];

// ── Tanzania ─────────────────────────────────────────────────────────────────
const TANZANIA_SITES: LibrarySite[] = [
  {
    name: 'Mafia Island Marine Park',
    location: 'Mafia Island, Pwani, Tanzania',
    region: 'Mafia Island',
    state: 'Pwani',
    category: 'reef',
    latitude: -7.900, longitude: 39.800,
    maxDepthMeters: 25,
    description: "Tanzania's premier dive destination — a marine park protecting one of the healthiest reef systems in East Africa. The walls and reef slopes support over 400 fish species and 50 coral genera. Whale sharks aggregate in Kilindoni Bay from October to March in one of the most accessible encounters in the Indian Ocean. The reef system around Chole Bay offers easy, shallow diving with excellent coral coverage, sea turtles, Napoleon wrasse, and dense fish schools. Far quieter and less developed than Zanzibar, Mafia offers genuine, uncrowded East African reef diving.",
    conditions: 'Calm inside the bay. Visibility 20–60 ft. 79–84°F. Mild current. All skill levels.',
    accessNotes: 'Fly from Dar es Salaam to Mafia Island (~30 min). A handful of eco-lodges with dive operations. Best October–March for whale sharks. Remote — limited infrastructure.',
  },
  {
    name: 'Zanzibar — Mnemba Atoll',
    location: 'Mnemba Island, Zanzibar, Tanzania',
    region: 'Zanzibar',
    state: 'Zanzibar',
    category: 'reef',
    latitude: -5.820, longitude: 39.380,
    maxDepthMeters: 25,
    description: "An exclusive private island surrounded by a protected reef — the best diving in the Zanzibar archipelago. The reef supports green and hawksbill turtles in impressive numbers, bottlenose dolphins, reef sharks, large schools of barracuda and batfish, and healthy hard coral gardens. Humpback whales pass offshore August–October. The combination of Zanzibar's Swahili culture, spice trade history, and Stone Town (UNESCO World Heritage) with accessible reef diving makes this a culturally rich dive destination. Diving is not restricted to guests of the island — day boats run from the Zanzibar mainland.",
    conditions: 'Calm, sheltered. Visibility 20–60 ft. 79–84°F. Mild current. All skill levels.',
    accessNotes: 'Boat from northeast Zanzibar coast (~30 min). Dive operators in Nungwi, Kendwa, and Matemwe. Fly to Zanzibar (ZNZ). Best October–March and June–October.',
  },
];

// ── Sri Lanka ────────────────────────────────────────────────────────────────
const SRI_LANKA_SITES: LibrarySite[] = [
  {
    name: 'HMS Hermes Wreck — Batticaloa',
    location: 'Batticaloa, Eastern Province, Sri Lanka',
    region: 'East Coast',
    state: 'Eastern Province',
    category: 'wreck',
    latitude: 7.750, longitude: 81.770,
    maxDepthMeters: 54,
    description: "The world's first purpose-built aircraft carrier to be sunk in combat — HMS Hermes was attacked and sunk by Japanese aircraft on April 9, 1942 off the coast of Sri Lanka. The wreck lies upright in 54 m with the flight deck at approximately 39 m. The 183 m carrier is remarkably intact, with the bow, island superstructure, and aircraft elevator clearly visible. Encrusted with corals and soft corals, the wreck attracts large schools of batfish, barracuda, and reef sharks. A historically significant and impressive deep dive accessible to experienced divers.",
    conditions: 'Current possible. Visibility 20–40 ft. 82–86°F. Deep — advanced to technical divers only.',
    accessNotes: 'Dive operators in Batticaloa and Trincomalee. Best April–September (east coast season). Fly to Colombo (CMB) then internal transport. Limited operators — book ahead.',
  },
  {
    name: 'Pigeon Island — Trincomalee',
    location: 'Pigeon Island, Trincomalee, Sri Lanka',
    region: 'East Coast',
    state: 'Eastern Province',
    category: 'reef',
    latitude: 8.720, longitude: 81.200,
    maxDepthMeters: 15,
    description: "Sri Lanka's best reef diving — a small national park island with healthy coral gardens that survived the 2004 tsunami and are recovering well. Blacktip reef sharks are the highlight — reliably seen on nearly every dive, cruising the shallow reef flat at arm's length. Hawksbill turtles, blue-spotted stingrays, moray eels, and a variety of Indian Ocean reef fish. The shallow depth and calm conditions inside the bay make this accessible to new divers. Combining Sri Lanka's extraordinary land-based wildlife (leopards, elephants, blue whales offshore) with reef diving makes a compelling overall destination.",
    conditions: 'Calm bay. Visibility 15–40 ft. 82–86°F. All skill levels.',
    accessNotes: 'Boat from Nilaveli beach (~10 min). Dive operators in Trincomalee/Nilaveli. Best April–September. National Park fee.',
  },
];

// ── India ────────────────────────────────────────────────────────────────────
const INDIA_SITES: LibrarySite[] = [
  {
    name: 'Andaman Islands — Havelock & Neil',
    location: 'Havelock Island, Andaman & Nicobar, India',
    region: 'Andaman Islands',
    state: 'Andaman & Nicobar',
    category: 'reef',
    latitude: 11.970, longitude: 93.010,
    maxDepthMeters: 30,
    description: "India's finest dive destination — remote volcanic islands in the Bay of Bengal with pristine coral reefs, manta rays, reef sharks, and exceptional marine biodiversity. The Andamans sit at the edge of the Coral Triangle and the reef health rivals Southeast Asia's best. Havelock Island's sites include dramatic walls, coral gardens, and manta cleaning stations. Neil Island offers accessible shore diving. The indigenous Andamanese cultures (some of the world's most isolated peoples) add anthropological significance. India's answer to the Maldives — at a fraction of the cost.",
    conditions: 'Calm in season. Visibility 20–80 ft. 82–86°F. Mild current. All skill levels.',
    accessNotes: 'Fly to Port Blair (IXZ) from Chennai, Kolkata, or Delhi. Ferry to Havelock (~2 hrs). Multiple dive operators. Best November–April. Indian permit required for some islands.',
  },
  {
    name: 'Lakshadweep Islands',
    location: 'Bangaram Atoll, Lakshadweep, India',
    region: 'Lakshadweep',
    state: 'Lakshadweep',
    category: 'reef',
    latitude: 10.940, longitude: 72.290,
    maxDepthMeters: 25,
    description: "India's secret paradise — a chain of 36 coral atolls 200–400 km off the Kerala coast, with the appearance of the Maldives but within Indian territory. Crystal-clear water, white sand, coconut palms, and healthy coral reefs with reef sharks, turtles, manta rays, and enormous schools of reef fish. Tourism is strictly controlled — visitor numbers are capped and only a few islands are open to tourists. The reefs are in excellent condition due to this isolation. Lakshadweep offers Maldives-quality diving at Indian prices with virtually no other divers.",
    conditions: 'Calm atolls. Visibility 40–100 ft. 82–86°F. Mild current. All skill levels.',
    accessNotes: 'Fly to Agatti (AGX) from Kochi or ship from Kochi (~14 hrs). Entry permit required from Lakshadweep Administration. Very limited accommodation. Book well ahead.',
  },
];

// ── Comoros ──────────────────────────────────────────────────────────────────
const COMOROS_SITES: LibrarySite[] = [
  {
    name: 'Mohéli Marine Park — Coelacanth Waters',
    location: 'Mohéli, Comoros',
    region: 'Mohéli',
    state: 'Mohéli',
    category: 'reef',
    latitude: -12.350, longitude: 43.700,
    maxDepthMeters: 30,
    description: "The Comoros Islands are where the coelacanth — a prehistoric fish thought extinct for 65 million years — was rediscovered alive in 1938, one of the most important zoological discoveries of the 20th century. While coelacanths live too deep (150–400 m) for recreational diving, the knowledge that they inhabit these waters adds extraordinary significance. The diving itself is excellent: healthy coral reefs, humpback whales (July–October), green sea turtles (Mohéli hosts the largest nesting population in the western Indian Ocean), dolphins, and reef sharks. Virtually undiscovered by international diving tourism.",
    conditions: 'Calm in season. Visibility 20–60 ft. 79–84°F. Mild current. All skill levels.',
    accessNotes: 'Fly to Moroni (HAH) via Nairobi, Dar es Salaam, or Réunion. Inter-island flight or boat to Mohéli. Very basic infrastructure. A genuine off-the-beaten-path destination.',
  },
];

// ── Combined export ──────────────────────────────────────────────────────────

export const INDIAN_OCEAN_SITES: LibrarySite[] = [
  ...MALDIVES_SITES,
  ...SEYCHELLES_SITES,
  ...MAURITIUS_SITES,
  ...MADAGASCAR_SITES,
  ...MOZAMBIQUE_SITES,
  ...TANZANIA_SITES,
  ...SRI_LANKA_SITES,
  ...INDIA_SITES,
  ...COMOROS_SITES,
];

export const INDIAN_OCEAN_COUNTRY_MAP: { sites: LibrarySite[]; country: string }[] = [
  { sites: MALDIVES_SITES,    country: 'Maldives'    },
  { sites: SEYCHELLES_SITES,  country: 'Seychelles'  },
  { sites: MAURITIUS_SITES,   country: 'Mauritius'   },
  { sites: MADAGASCAR_SITES,  country: 'Madagascar'  },
  { sites: MOZAMBIQUE_SITES,  country: 'Mozambique'  },
  { sites: TANZANIA_SITES,    country: 'Tanzania'    },
  { sites: SRI_LANKA_SITES,   country: 'Sri Lanka'   },
  { sites: INDIA_SITES,       country: 'India'       },
  { sites: COMOROS_SITES,      country: 'Comoros'     },
];
