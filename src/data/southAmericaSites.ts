/**
 * South America Dive Site Library
 *
 * Covers: Colombia, Ecuador (Galápagos), Brazil, Venezuela,
 * Chile, Bolivia, Argentina, Uruguay.
 */

import { LibrarySite } from './usSites';

// ── Colombia ──────────────────────────────────────────────────────────────────
const COLOMBIA_SITES: LibrarySite[] = [
  {
    name: 'Malpelo Island',
    location: 'Pacific Ocean, Colombia (500 km offshore)',
    region: 'Pacific Colombia',
    state: 'Valle del Cauca',
    category: 'reef',
    latitude: 3.989, longitude: -81.607,
    maxDepthMeters: 40,
    description: "One of the most remote and spectacular dive sites on Earth — a UNESCO World Heritage site and strict wildlife sanctuary 500 km offshore in the Pacific. The fish biomass here defies belief: walls of hundreds of scalloped hammerhead sharks, schools of 1,000+ silky sharks, Galápagos sharks, whale sharks, mola mola (ocean sunfish), and massive spawning aggregations of almaco jack. The underwater topography of volcanic pinnacles, caverns, and caverns amplifies the effect. Frequently listed among the top 3 dive destinations in the world alongside Cocos and Galápagos.",
    conditions: 'Open Pacific, strong currents — advanced to expert divers only. Visibility 30–80 ft. 73–82°F. Liveaboard only. 36-hour transit from Buenaventura.',
    accessNotes: 'Liveaboard only from Buenaventura or Tumaco, Colombia. UNESCO Wildlife Sanctuary — strict access limits. Only licensed vessels permitted. 5–8 day trips. Book 12+ months in advance.',
  },
  {
    name: 'Providencia Island',
    location: 'Providencia, San Andrés y Providencia, Colombia',
    region: 'Caribbean Colombia',
    state: 'San Andrés y Providencia',
    category: 'reef',
    latitude: 13.347, longitude: -81.373,
    maxDepthMeters: 25,
    description: "A UNESCO Biosphere Reserve rising from the Caribbean 750 km from the Colombian mainland — home to the third-largest coral reef barrier in the world and one of the most pristine reef systems in the entire Caribbean. Dubbed the 'Sea of Seven Colors' for the dramatic color variation of the water over different depths and substrates. Dense elkhorn and staghorn coral forests, vast fields of brain coral, enormous sea turtles, Caribbean reef sharks, nurse sharks, and schools of every Caribbean reef species. Far less visited than most Caribbean islands, the reef is in exceptional health.",
    conditions: 'Generally calm. Visibility 60–100 ft. 78–82°F. Some current on the outer reef. All skill levels.',
    accessNotes: 'Fly to Providencia (ADZ) via San Andrés island from Bogotá or Medellín. Small island — a handful of dive operators. Accommodation limited; book well ahead. Tranquil, unhurried pace.',
  },
  {
    name: 'Rosario Islands',
    location: 'Cartagena, Bolívar, Colombia',
    region: 'Caribbean Colombia',
    state: 'Bolívar',
    category: 'reef',
    latitude: 10.178, longitude: -75.750,
    maxDepthMeters: 20,
    description: "An archipelago of 27 coral islands 45 km from Cartagena — the most accessible reef diving in Colombia and the gateway to Caribbean diving for most visitors. Colorful coral gardens, sponge formations, sea turtles, nurse sharks, spotted eagle rays, and abundant reef fish. The Corales del Rosario y San Bernardo National Natural Park protects the islands. An easy half-day or full-day boat trip from one of South America's most beautiful colonial cities.",
    conditions: 'Protected waters. Visibility 20–60 ft (can vary). 79–82°F. Generally calm. All skill levels.',
    accessNotes: 'Boat from Cartagena waterfront (~1 hr). Many day-trip operators depart from the Muelle Turístico. Often combined with snorkeling. National Park entry fee.',
  },
  {
    name: 'San Andrés Island',
    location: 'San Andrés, San Andrés y Providencia, Colombia',
    region: 'Caribbean Colombia',
    state: 'San Andrés y Providencia',
    category: 'reef',
    latitude: 12.532, longitude: -81.718,
    maxDepthMeters: 25,
    description: "The more accessible and developed half of Colombia's Caribbean island territory — a UNESCO Seaflower Biosphere Reserve famous for the 'Sea of Seven Colors,' the extraordinary chromatic effect of turquoise, teal, cobalt, and aquamarine hues over different reef structures visible from the air and surface. Underwater, wall dives at La Pirámide and El Acuario drop through healthy hard coral with Caribbean reef sharks, nurse sharks, eagle rays, and barracuda. Night dives over the sand flats reveal lobsters, octopus, and bioluminescence. The combination of easy access (direct flights from Bogotá), warm clear water, and strong dive infrastructure makes San Andrés the best entry point to Colombian Caribbean diving.",
    conditions: 'Protected western side year-round. Visibility 60–100 ft. 79–82°F. Light current. All skill levels.',
    accessNotes: 'Direct flights from Bogotá, Medellín, and Cali to San Andrés (ADZ). Numerous dive operators on the island. Day trips also run to the remote Serrana and Roncador Banks for advanced open-water diving. Note: Colombians require a special tourist card (Tarjeta de Turismo) for entry.',
  },
];

// ── Ecuador — Galápagos Islands ───────────────────────────────────────────────
const ECUADOR_SITES: LibrarySite[] = [
  {
    name: 'Galápagos — Darwin Island & Wolf Island',
    location: 'Darwin & Wolf Islands, Galápagos, Ecuador',
    region: 'Northern Galápagos',
    state: 'Galápagos',
    category: 'reef',
    latitude: 1.677, longitude: -92.004,
    maxDepthMeters: 30,
    description: "The greatest dive sites on Earth. Darwin and Wolf Islands in the far north of the Galápagos are home to the largest recorded aggregation of whale sharks anywhere in the world — primarily large pregnant females, sometimes 200–300 individuals. Schools of 500+ scalloped hammerhead sharks patrol the underwater seamounts. Galápagos sharks, silky sharks, tiger sharks, Galápagos fur seals, Galápagos sea lions, and vast schools of barracuda and jacks. Darwin's Arch (which partially collapsed in 2021 but diving continues) was the most iconic above-water symbol. The concentration of large marine life here is unmatched by any other dive site on Earth. Liveaboard only.",
    conditions: 'Strong, unpredictable currents — experienced divers only. Visibility 20–80 ft (nutrient-rich water). 65–78°F (thermoclines). Liveaboard only.',
    accessNotes: 'Liveaboard only from Puerto Ayora (Santa Cruz) or Puerto Baquerizo Moreno (San Cristóbal). 8–10 day Galápagos liveaboard; Darwin/Wolf typically on days 2–4. Only licensed Galápagos operators. Book 12–18 months in advance. National Park fee (~$200 USD) required.',
  },
  {
    name: 'Galápagos — Gordon Rocks',
    location: 'Santa Cruz Island, Galápagos, Ecuador',
    region: 'Central Galápagos',
    state: 'Galápagos',
    category: 'reef',
    latitude: -0.611, longitude: -90.434,
    maxDepthMeters: 30,
    description: "The most famous dive site accessible as a day trip from Puerto Ayora — a collapsed volcanic crater that creates a swirling circular current that concentrates marine life in spectacular density. Scalloped hammerhead sharks cruise the blue water in schools. Galápagos sea lions do barrel-rolls around divers. Green sea turtles rest on rocky ledges. White-tipped reef sharks rest on the bottom. Eagle rays glide in formation. A site of extreme diversity where every dive is genuinely different. Challenging currents make this a favorite of experienced divers.",
    conditions: 'Strong, swirling currents — intermediate to advanced divers. Visibility 30–60 ft. 65–75°F. Day trip from Santa Cruz.',
    accessNotes: 'Day trip from Puerto Ayora, Santa Cruz (~45 min). Numerous day-trip operators run Gordon Rocks. Must be dived with a licensed Galápagos dive operator. 2-tank dive.',
  },
  {
    name: 'Galápagos — Kicker Rock (León Dormido)',
    location: 'San Cristóbal Island, Galápagos, Ecuador',
    region: 'Eastern Galápagos',
    state: 'Galápagos',
    category: 'reef',
    latitude: -0.875, longitude: -89.527,
    maxDepthMeters: 25,
    description: "Two massive volcanic tuff cones rising 148 m from the sea, split by a narrow channel that divers drift through in one of the most visually dramatic dive settings in the world. Scalloped hammerhead sharks cruise just offshore. Galápagos sharks and whitetip reef sharks patrol the rock faces. Green sea turtles, spotted eagle rays, golden rays, manta rays, and enormous schools of tropical fish. The towering walls of the rock draped in encrusting organisms and sea lions zipping past create an otherworldly experience. One of the most photogenic dive sites on the planet.",
    conditions: 'Current through the channel varies. Visibility 30–60 ft. 65–75°F. Intermediate divers.',
    accessNotes: 'Day trip from Puerto Baquerizo Moreno, San Cristóbal Island (~45 min). Best entry point to the Galápagos for budget travelers — San Cristóbal has cheaper flights. Licensed local dive operators run Kicker Rock daily.',
  },
];

// ── Brazil ────────────────────────────────────────────────────────────────────
const BRAZIL_SITES: LibrarySite[] = [
  {
    name: 'Fernando de Noronha',
    location: 'Fernando de Noronha, Pernambuco, Brazil',
    region: 'Fernando de Noronha',
    state: 'Pernambuco',
    category: 'reef',
    latitude: -3.856, longitude: -32.430,
    maxDepthMeters: 30,
    description: "A UNESCO World Heritage archipelago 350 km off Brazil's northeast coast with the clearest water in the South Atlantic — visibility regularly exceeds 130 ft. A resident pod of hundreds of spinner dolphins inhabits Baía dos Golfinhos and can be encountered on nearly every dive. Green sea turtles nest on the beaches and feed on the reefs in extraordinary numbers. Reef sharks, nurse sharks, manta rays, and enormous schools of Atlantic fish. The islands are strictly protected — daily visitor numbers are capped, making it one of the least crowded world-class dive destinations anywhere.",
    conditions: 'Calm on the protected (western) side. Visibility 80–150 ft. 77–84°F. Some current on outer sites. All levels on most sites.',
    accessNotes: 'Fly from Recife or Natal to Fernando de Noronha (FEN). Accommodation and dive operators on the island. Environmental tax (TAXA) required — increases with length of stay. Best January–March (calmest seas).',
  },
  {
    name: 'Abrolhos Archipelago',
    location: 'Caravelas, Bahia, Brazil',
    region: 'Abrolhos Archipelago',
    state: 'Bahia',
    category: 'reef',
    latitude: -17.970, longitude: -38.694,
    maxDepthMeters: 25,
    description: "Brazil's most important marine park and the only significant coral reef system in the South Atlantic. Famous for unique coral formations called chapeirões — mushroom-shaped columns that grow from a narrow base on the sandy floor and bloom outward at the top, reaching 5 m tall. These formations are found nowhere else in the world. From July to November, the entire South Atlantic population of humpback whales gathers in these waters to give birth and mate — singing males and mother-calf pairs can be encountered in and out of the water. Reef sharks, manta rays, sea turtles, and the otherworldly chapeirão landscape.",
    conditions: 'Mild to moderate swell. Visibility 20–60 ft. 24–28°C. Best May–September (calmer seas, whale season).',
    accessNotes: 'Boat trip from Caravelas, Bahia (~4 hrs) or liveaboard. National Marine Park — entry permit required. Limited operators. Stay on the island is possible (caretaker station). Whale watching boats also run humpback trips separately.',
  },
  {
    name: 'Arraial do Cabo',
    location: 'Arraial do Cabo, Rio de Janeiro, Brazil',
    region: 'Rio de Janeiro Coast',
    state: 'Rio de Janeiro',
    category: 'reef',
    latitude: -22.967, longitude: -42.029,
    maxDepthMeters: 20,
    description: "Known as the 'Brazilian Caribbean' or 'Brazilian Galápagos' — Arraial do Cabo is Brazil's clearest dive destination, fed by the cold Malvinas (Falkland) upwelling current that suppresses the murky warm-water inflow typical of the Brazilian coast. Visibility regularly exceeds 100 ft, extraordinary for South America's Atlantic coast. Green sea turtles feed on the rich algae beds and are encountered on almost every dive. Large spotted eagle rays, moray eels, barracuda, and dense schools of Atlantic reef fish populate the rocky reefs and caverns. Accessible as a day trip or weekend escape from Rio de Janeiro.",
    conditions: 'Cold upwelling — water can be 16–22°C (5mm wetsuit recommended). Visibility 30–100+ ft. Some current on exposed sites. Intermediate skill level.',
    accessNotes: 'Drive or bus from Rio de Janeiro (~3 hrs). Arraial do Cabo town has multiple dive operators. Day-trip or weekend destination. Best March–October (upwelling strongest, visibility best).',
  },
];

// ── Peru ──────────────────────────────────────────────────────────────────────
const PERU_SITES: LibrarySite[] = [
  {
    name: 'El Ñuro — Whale Shark Beach',
    location: 'El Ñuro, Máncora, Piura, Peru',
    region: 'Northern Peru Coast',
    state: 'Piura',
    category: 'reef',
    latitude: -4.042, longitude: -81.174,
    maxDepthMeters: 15,
    description: "A small fishing village beach in northern Peru where whale sharks reliably gather close to shore from November through March, drawn by anchoveta and plankton blooms of the warm El Niño current. The sharks approach to within meters of the beach and can be dived or snorkeled without a boat. This accessibility — walking into the water to dive with the world's largest fish — is extraordinarily rare. Rocky reefs also host sea turtles, moray eels, and diverse Pacific reef fish. One of the most unusual and low-key big-animal encounters in South America.",
    conditions: 'Calm, beach entry. Visibility 20–50 ft. 24–28°C. Whale sharks November–March. All skill levels.',
    accessNotes: 'Near Máncora, northern Peru — fly to Piura or take overnight bus from Lima (~16 hrs). El Ñuro is a 20-min taxi from Máncora. No dive operator needed for whale sharks; snorkeling fins and mask sufficient. Local guides available.',
  },
  {
    name: 'Paracas — Islas Ballestas',
    location: 'Paracas, Ica, Peru',
    region: 'Paracas Peninsula',
    state: 'Ica',
    category: 'shore',
    latitude: -13.728, longitude: -76.457,
    maxDepthMeters: 18,
    description: "The Humboldt Current sweeps cold, nutrient-rich water along Peru's Pacific coast, creating one of the world's most productive marine ecosystems — and one of the most unusual dive environments. The Islas Ballestas are home to enormous colonies of Humboldt penguins, South American sea lions, and Peruvian boobies. Diving here means sharing the water with penguins that torpedo past at extraordinary speed and sea lions that spiral around divers. Cold, sometimes murky water, but the wildlife — penguins underwater, seals, and the sheer abundance of marine life supported by the upwelling — is unlike anything in the tropics.",
    conditions: 'Cold Humboldt Current: 14–18°C — drysuit or 7mm wetsuit essential. Visibility 10–40 ft. Some surge. Intermediate skill level.',
    accessNotes: 'Drive or bus from Lima (~3.5 hrs) to Paracas. Dive operators in Paracas town. Ballestas boat tours also available for non-divers. Paracas National Reserve entry fee. Best April–November.',
  },
];

// ── Venezuela ─────────────────────────────────────────────────────────────────
const VENEZUELA_SITES: LibrarySite[] = [
  {
    name: 'Los Roques Archipelago',
    location: 'Los Roques, Federal Dependencies, Venezuela',
    region: 'Los Roques',
    state: 'Federal Dependencies',
    category: 'reef',
    latitude: 11.850, longitude: -66.850,
    maxDepthMeters: 20,
    description: "A vast, remote Caribbean atoll 160 km north of Caracas and one of the largest marine parks in the Caribbean — largely untouched by mass tourism. Pristine coral gardens with exceptional hard coral coverage, giant sea fans, abundant sponges, and some of the most intact reef structure remaining in the Caribbean. Nurse sharks rest in the shallows, Caribbean reef sharks patrol the drop-offs, sea turtles are ubiquitous, and the shallow turquoise waters between the sand cays are crystalline. The above-water scenery — endless white sand, flamingos, and flat calm turquoise water — is equally spectacular.",
    conditions: 'Protected atoll waters. Visibility 60–100 ft. 80–84°F. Light current. All skill levels.',
    accessNotes: 'Charter flight or commercial service from Caracas to Gran Roque (LRV) — ~40 min. Accommodation in posadas on Gran Roque. Dive operators on the island. Note: check current travel advisories for Venezuela before planning.',
  },
];

// ── Chile ─────────────────────────────────────────────────────────────────────
const CHILE_SITES: LibrarySite[] = [
  {
    name: 'Easter Island (Rapa Nui)',
    location: 'Isla de Pascua, Valparaíso, Chile',
    region: 'Easter Island',
    state: 'Valparaíso',
    category: 'reef',
    latitude: -27.113, longitude: -109.350,
    maxDepthMeters: 30,
    description: "One of the most remote inhabited islands on Earth — 3,500 km from mainland Chile in the open Pacific — with some of the clearest water on the planet due to its isolation from any continental runoff. Visibility can exceed 200 ft. The diving offers endemic species found nowhere else on Earth, including the Easter Island butterflyfish. Moray eels, lobsters, Galapagos sharks, and a rich variety of invertebrates on stark volcanic rock formations. The dramatic underwater topography mirrors the island's above-ground volcanic landscape. Several operators have placed replica moai underwater for a uniquely Easter Island dive experience.",
    conditions: 'Open Pacific swell — exposed sites. Visibility 100–200+ ft. 66–72°F year-round. Some current. Intermediate divers.',
    accessNotes: 'Fly to Mataveri International Airport (IPC) from Santiago or Tahiti (~5–6 hrs). Accommodation and a few dive operators in Hanga Roa. Rental equipment available. Best February–April (warmest water, calmest seas).',
  },
  {
    name: 'Robinson Crusoe Island',
    location: 'Juan Fernández Archipelago, Valparaíso, Chile',
    region: 'Juan Fernández Archipelago',
    state: 'Valparaíso',
    category: 'reef',
    latitude: -33.638, longitude: -78.838,
    maxDepthMeters: 30,
    description: "One of the most remote inhabited islands on Earth — 670 km off the Chilean coast, named for Alexander Selkirk, the castaway who inspired Daniel Defoe's Robinson Crusoe. The Juan Fernández Archipelago is a UNESCO World Biosphere Reserve with a staggering proportion of endemic species. Underwater, the Juan Fernández fur seal — once nearly extinct, now recovering — approaches divers playfully in large numbers. Endemic fish, unique invertebrates, and dramatic volcanic rock formations create a dive landscape found nowhere else on the planet. Excellent visibility in the cold clear Pacific water.",
    conditions: 'Cold 14–18°C. Visibility 60–100 ft. Some swell on exposed sites. Intermediate divers. Wetsuit 5–7mm.',
    accessNotes: 'Small propeller aircraft from Santiago (SCL) to Robinson Crusoe (JFR) — ~2–3 hrs, limited frequency. Very small island with basic accommodation. One or two dive operators. An expensive, logistically complex trip — entirely worth it for serious divers.',
  },
];

// ── Bolivia ───────────────────────────────────────────────────────────────────
const BOLIVIA_SITES: LibrarySite[] = [
  {
    name: 'Lake Titicaca — Inca Ruins',
    location: 'Copacabana, La Paz, Bolivia',
    region: 'Lake Titicaca',
    state: 'La Paz',
    category: 'lake',
    latitude: -16.167, longitude: -69.090,
    maxDepthMeters: 20,
    description: "The world's highest navigable lake at 3,812 m above sea level — and a genuinely unique dive experience. The lake bottom holds submerged Inca and pre-Inca ceremonial offerings, ruins, and artifacts, some over 2,000 years old. Scientific expeditions have discovered gold figurines, ceramics, and carved stone structures beneath the surface. Diving here requires altitude dive planning (modified tables or Bühlmann calculations), and the cold, thin air demands careful surface interval management. The sensation of diving in freshwater under a vivid blue Andean sky with snow-capped peaks surrounding the lake is unlike anything else in diving.",
    conditions: 'Freshwater, cold 10–14°C. Altitude: 3,812 m — altitude dive tables mandatory. Visibility 10–30 ft. Light current.',
    accessNotes: 'Fly to La Paz (LPB), then bus or taxi to Copacabana (~3 hrs). A handful of dive operators in Copacabana. Must be fully acclimatized to altitude before diving — spend at least 2–3 days at altitude first. Altitude tables or Bühlmann computer mandatory.',
  },
];

// ── Argentina ─────────────────────────────────────────────────────────────────
const ARGENTINA_SITES: LibrarySite[] = [
  {
    name: 'Puerto Madryn — Patagonian Diving',
    location: 'Puerto Madryn, Chubut, Argentina',
    region: 'Patagonia',
    state: 'Chubut',
    category: 'shore',
    latitude: -42.772, longitude: -65.036,
    maxDepthMeters: 20,
    description: "A cold-water diving destination unlike anything else in South America. The Gulf of Nuevo and Valdés Peninsula create sheltered diving conditions in Patagonian waters teeming with sea life: South American sea lions are curious and playful with divers, elephant seals loll on the beaches just above the dive sites, Magellanic penguins parade across the shore. Underwater, cold-water kelp forests provide habitat for a diverse community of Patagonian species. The region is a UNESCO World Heritage site for its extraordinary wildlife. Whale watching season (June–December) brings southern right whales into the bay — occasional encounters underwater.",
    conditions: 'Cold 8–14°C year-round — thick wetsuit (7mm) or drysuit essential. Visibility 20–60 ft. Generally calm in the Gulf. All skill levels.',
    accessNotes: 'Fly to Trelew (REL) or Comodoro Rivadavia (CRD) from Buenos Aires, then bus to Puerto Madryn. Multiple dive operators in town. Best October–April (sea lion season). Combine with overland wildlife tours to Punta Tombo (world\'s largest Magellanic penguin colony).',
  },
];

// ── Uruguay ───────────────────────────────────────────────────────────────────
const URUGUAY_SITES: LibrarySite[] = [
  {
    name: 'Admiral Graf Spee Wreck',
    location: 'Montevideo, Uruguay',
    region: 'Río de la Plata',
    state: 'Montevideo',
    category: 'wreck',
    latitude: -34.900, longitude: -56.150,
    maxDepthMeters: 20,
    description: "The most famous WWII warship wreck in the Americas — the German pocket battleship Admiral Graf Spee, scuttled on December 17, 1939 by her own captain following the Battle of the River Plate. The Graf Spee was the first major naval engagement of WWII and the battle that ended with this ship's destruction just outside Montevideo harbor. The wreck lies in 15–20 m and is accessible to sport divers: the rangefinder tower, gun turrets, and large hull sections are visible. The Río de la Plata's murky water limits visibility, but the sheer historical weight of diving a famous WWII warship makes this a bucket-list experience for wreck divers.",
    conditions: 'Limited visibility 3–10 ft (Río de la Plata is famously murky). 14–22°C seasonal. Flat calm typical.',
    accessNotes: 'Dive operators in Montevideo run the Graf Spee. Short boat ride from port. Best October–April (warmer water, some visibility improvement). A second significant wreck, the Tacoma, lies nearby.',
  },
];

// ── Combined export ────────────────────────────────────────────────────────────

export const SOUTH_AMERICA_SITES: LibrarySite[] = [
  ...COLOMBIA_SITES,
  ...ECUADOR_SITES,
  ...BRAZIL_SITES,
  ...PERU_SITES,
  ...VENEZUELA_SITES,
  ...CHILE_SITES,
  ...BOLIVIA_SITES,
  ...ARGENTINA_SITES,
  ...URUGUAY_SITES,
];

/** All countries included in this file, mapped to their country name for WorldSite tagging. */
export const SOUTH_AMERICA_COUNTRY_MAP: { sites: LibrarySite[]; country: string }[] = [
  { sites: COLOMBIA_SITES,   country: 'Colombia'   },
  { sites: ECUADOR_SITES,    country: 'Ecuador'    },
  { sites: BRAZIL_SITES,     country: 'Brazil'     },
  { sites: PERU_SITES,       country: 'Peru'       },
  { sites: VENEZUELA_SITES,  country: 'Venezuela'  },
  { sites: CHILE_SITES,      country: 'Chile'      },
  { sites: BOLIVIA_SITES,    country: 'Bolivia'    },
  { sites: ARGENTINA_SITES,  country: 'Argentina'  },
  { sites: URUGUAY_SITES,    country: 'Uruguay'    },
];
