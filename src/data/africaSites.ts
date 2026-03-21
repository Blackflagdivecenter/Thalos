/**
 * Africa Dive Site Library
 *
 * Covers: South Africa, Kenya, Cape Verde, Senegal, Ghana.
 * Egypt is in redSeaSites.ts, Tanzania/Mozambique in indianOceanSites.ts.
 */

import { LibrarySite } from './usSites';

// ── South Africa ─────────────────────────────────────────────────────────────
const SOUTH_AFRICA_SITES: LibrarySite[] = [
  {
    name: 'Sardine Run — Wild Coast',
    location: 'Port St Johns, Eastern Cape, South Africa',
    region: 'Wild Coast',
    state: 'Eastern Cape',
    category: 'reef',
    latitude: -31.628, longitude: 29.540,
    maxDepthMeters: 20,
    description: "The greatest marine wildlife event on Earth — every winter (May–July), billions of sardines migrate along South Africa's east coast, pursued by dolphins, sharks, whales, seals, gannets, and game fish in a feeding frenzy of apocalyptic proportions. Divers and snorkelers enter bait balls — dense spheres of sardines being attacked from all directions by Bryde's whales lunging through the center, dolphins herding from below, copper sharks slashing from the sides, and Cape gannets dive-bombing from above. The scale is beyond comprehension. One of the ultimate bucket-list wildlife experiences.",
    conditions: 'Open ocean, cold 18–22°C. Visibility 10–40 ft. Strong currents. Advanced — open water conditions and large predators.',
    accessNotes: 'Operators base from Port St Johns, Mbotyi, or Port Edward. Domestic flight to East London or Durban then drive. June–July peak season. Boat-based — divers enter when bait balls are located. Action is unpredictable — patience required.',
  },
  {
    name: 'Aliwal Shoal',
    location: 'Umkomaas, KwaZulu-Natal, South Africa',
    region: 'KwaZulu-Natal',
    state: 'KwaZulu-Natal',
    category: 'reef',
    latitude: -30.265, longitude: 30.850,
    maxDepthMeters: 30,
    description: "A fossilized sand dune 5 km offshore that has become one of South Africa's most important marine habitats. Ragged-tooth sharks (sand tiger sharks) aggregate in large numbers at Cathedral — a dramatic overhang where dozens of these menacing-looking but docile sharks rest together (June–November). Oceanic blacktip sharks (June–July), tiger sharks, hammerheads, and whale sharks are all encountered seasonally. The reef itself supports hard and soft corals, moray eels, and a rich invertebrate community. Arguably the best shark diving in South Africa outside the sardine run.",
    conditions: 'Surge and current possible. Visibility 15–40 ft. 68–77°F. Intermediate.',
    accessNotes: 'Boat launch from Umkomaas beach (~30 min south of Durban). Several operators. Ragged-tooth sharks June–November. Oceanic blacktips June–July. Year-round diving.',
  },
  {
    name: 'Sodwana Bay',
    location: 'Sodwana Bay, KwaZulu-Natal, South Africa',
    region: 'KwaZulu-Natal',
    state: 'KwaZulu-Natal',
    category: 'reef',
    latitude: -27.530, longitude: 32.680,
    maxDepthMeters: 30,
    description: "The southernmost coral reef system in Africa — and one of the most biodiverse reef areas in the Indian Ocean. The reefs at Two Mile, Five Mile, Seven Mile, and Nine Mile support over 1,200 species of fish and 100 species of coral. Loggerhead and leatherback turtles nest on the beaches (November–February). Whale sharks, manta rays, and ragged-tooth sharks are seasonal visitors. Coelacanths — the 'living fossil' fish thought extinct for 65 million years — have been found in the deep canyons off Sodwana, adding extraordinary scientific significance.",
    conditions: 'Boat launch through surf. Visibility 15–60 ft. 73–82°F. Some current. Intermediate (boat launch can be rough).',
    accessNotes: 'Drive from Durban (~5 hrs) to iSimangaliso Wetland Park. KwaZulu-Natal Wildlife camps and private lodges. Several dive operators. Launch through surf in inflatable boats.',
  },
  {
    name: 'False Bay — Seal Island & Kelp Forests',
    location: 'Simon\'s Town, Western Cape, South Africa',
    region: 'Cape Town',
    state: 'Western Cape',
    category: 'shore',
    latitude: -34.140, longitude: 18.490,
    maxDepthMeters: 20,
    description: "Cape Town's underwater world is dominated by magnificent kelp forests — towering canopies of sea bamboo swaying in the current, creating an underwater cathedral of green-gold light. The Cape's cold, nutrient-rich waters support an extraordinary diversity of endemic species: shy sharks (catsharks that curl into a ball), Cape fur seals (playful encounters at Seal Island), seven-gill cow sharks (a prehistoric species), and colorful nudibranchs. The kelp forest ecosystem, with its filtered light and dense marine life, is unlike any tropical diving experience. The My Octopus Teacher documentary brought global attention to this ecosystem.",
    conditions: 'Cold 8–16°C — thick wetsuit or drysuit essential. Visibility 10–40 ft. Surge on exposed sites. Intermediate.',
    accessNotes: 'Dive operators in Simon\'s Town and Cape Town. Shore and boat dives. Seven-gill shark dives at Miller\'s Point. Seal Island trips from False Bay. Year-round diving.',
  },
];

// ── Kenya ────────────────────────────────────────────────────────────────────
const KENYA_SITES: LibrarySite[] = [
  {
    name: 'Watamu Marine National Park',
    location: 'Watamu, Kilifi County, Kenya',
    region: 'Kenya Coast',
    state: 'Kilifi',
    category: 'reef',
    latitude: -3.350, longitude: 40.030,
    maxDepthMeters: 25,
    description: "Kenya's oldest marine protected area and one of the best-managed marine parks in East Africa. The fringing reef supports over 600 fish species, green and hawksbill turtles, whale sharks (seasonal), and healthy coral gardens. The park's long protection history has produced reef fish densities significantly higher than unprotected areas. Giant grouper, Napoleon wrasse, and large schools of snappers and sweetlips are common. The combination of safari (Tsavo East is 3 hours away) and reef diving makes Kenya a compelling dual-purpose destination.",
    conditions: 'Calm in season. Visibility 15–40 ft. 79–84°F. All skill levels.',
    accessNotes: 'Fly to Mombasa (MBA) or Malindi (MYD), then drive to Watamu. Several dive operators. Best October–March (northeast monsoon — calmer seas, better visibility).',
  },
];

// ── Cape Verde ───────────────────────────────────────────────────────────────
const CAPE_VERDE_SITES: LibrarySite[] = [
  {
    name: 'Sal Island — Sharks & Wrecks',
    location: 'Santa Maria, Sal, Cape Verde',
    region: 'Barlavento Islands',
    state: 'Sal',
    category: 'reef',
    latitude: 16.600, longitude: -22.900,
    maxDepthMeters: 30,
    description: "A volcanic archipelago in the mid-Atlantic with warm water, excellent visibility, and a growing reputation as an uncrowded dive destination. Sal Island's dive sites include nurse shark caves where dozens of nurse sharks rest in daylight, lemon sharks in the shallows, large schools of jacks and barracuda, and several interesting wrecks including a deliberately sunk cargo ship. Humpback whales pass offshore March–May. Loggerhead turtles nest on Sal's beaches (one of the most important nesting sites in the world). The mid-Atlantic location creates a unique mix of Atlantic and tropical species.",
    conditions: 'Generally calm on the leeward side. Visibility 40–100 ft. 72–79°F. Some current. All skill levels.',
    accessNotes: 'Fly to Sal (SID) from Lisbon, London, or other European cities. Several dive operators in Santa Maria. Year-round diving. Affordable.',
  },
];

// ── Senegal ────────────────────────────────────────────────────────────────
const SENEGAL_SITES: LibrarySite[] = [
  {
    name: 'Gorée Island & Dakar Wrecks',
    location: 'Gorée Island, Dakar, Senegal',
    region: 'Cap-Vert Peninsula',
    state: 'Dakar',
    category: 'wreck',
    latitude: 14.670, longitude: -17.400,
    maxDepthMeters: 25,
    description: "West Africa's most accessible dive destination — the waters off Dakar and the UNESCO World Heritage island of Gorée harbor a collection of wrecks, rocky reefs, and volcanic formations. Several cargo ships and military vessels rest on the sandy bottom, colonized by tropical fish, barracuda, grouper, and occasional sea turtles. The rocky reefs off the Almadies peninsula (the westernmost point of mainland Africa) support colorful sponges and Atlantic marine life. The cold Canary Current brings nutrients and large schools of pelagic fish. Diving here combines well with Gorée Island's powerful historical significance.",
    conditions: 'Some current and surge. Visibility 15–50 ft. 68–79°F (seasonal). Intermediate.',
    accessNotes: 'Dive operators in Dakar. Fly to Dakar (DSS). Year-round diving. Best November–May (dry season, calmer seas). Gorée Island ferry from Dakar.',
  },
];

// ── Ghana ──────────────────────────────────────────────────────────────────
const GHANA_SITES: LibrarySite[] = [
  {
    name: 'Cape Three Points & Busua Wrecks',
    location: 'Cape Three Points, Western Region, Ghana',
    region: 'Western Coast',
    state: 'Western Region',
    category: 'wreck',
    latitude: 4.740, longitude: -2.090,
    maxDepthMeters: 25,
    description: "Ghana's southernmost point and emerging dive destination on the Gulf of Guinea. The coastline between Busua and Cape Three Points features rocky reef formations, WWII-era wrecks from the Battle of the Atlantic, and the warm Guinea Current supporting tropical Atlantic marine life. Large groupers, barracuda, rays, and sea turtles inhabit the reefs. The diving is frontier-quality — undocumented sites are still being discovered. Above water, the forts and castles of the Gold Coast (UNESCO World Heritage) provide extraordinary historical context. Ghana's growing dive community is working to protect and document the underwater heritage.",
    conditions: 'Warm 79–84°F. Visibility 10–40 ft (varies). Some current. All skill levels on protected sites.',
    accessNotes: 'Drive from Accra (~5 hrs) or Takoradi (~2 hrs). A small but growing number of dive operators. Very affordable. Best November–March (dry season).',
  },
];

// ── Combined export ──────────────────────────────────────────────────────────

export const AFRICA_SITES: LibrarySite[] = [
  ...SOUTH_AFRICA_SITES,
  ...KENYA_SITES,
  ...CAPE_VERDE_SITES,
  ...SENEGAL_SITES,
  ...GHANA_SITES,
];

export const AFRICA_COUNTRY_MAP: { sites: LibrarySite[]; country: string }[] = [
  { sites: SOUTH_AFRICA_SITES,  country: 'South Africa'  },
  { sites: KENYA_SITES,         country: 'Kenya'         },
  { sites: CAPE_VERDE_SITES,    country: 'Cape Verde'    },
  { sites: SENEGAL_SITES,       country: 'Senegal'       },
  { sites: GHANA_SITES,         country: 'Ghana'         },
];
