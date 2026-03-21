/**
 * Mediterranean Dive Site Library
 *
 * Covers: Greece, Malta, Croatia, Spain, Turkey, Italy, France, Cyprus.
 */

import { LibrarySite } from './usSites';

// ── Greece ───────────────────────────────────────────────────────────────────
const GREECE_SITES: LibrarySite[] = [
  {
    name: 'HMHS Britannic Wreck',
    location: 'Kea Island, Cyclades, Greece',
    region: 'Cyclades',
    state: 'South Aegean',
    category: 'wreck',
    latitude: 37.421, longitude: 24.287,
    maxDepthMeters: 120,
    description: "The sister ship of RMS Titanic — HMHS Britannic sank on November 21, 1916 after striking a mine while serving as a hospital ship in WWI. At 269 m long, she is the largest passenger ship on the seabed. The wreck lies on her starboard side in 120 m — deep but accessible to technical divers. The bow, davits, portholes, and hospital fittings are remarkably preserved. Jacques Cousteau first dived the wreck in 1975. Diving the Britannic is one of the ultimate achievements in technical wreck diving.",
    conditions: 'Deep technical dive — 120 m. Strong current possible. Visibility 40–100 ft. 68–75°F. Technical/trimix divers only.',
    accessNotes: 'Special permit from the Greek Ministry of Culture required. Technical dive operators from Athens run expeditions. Kea is accessible by ferry from Lavrio. Very limited spots per year.',
  },
  {
    name: 'Santorini Caldera',
    location: 'Santorini, Cyclades, Greece',
    region: 'Cyclades',
    state: 'South Aegean',
    category: 'reef',
    latitude: 36.400, longitude: 25.430,
    maxDepthMeters: 30,
    description: "Diving inside a flooded volcanic caldera — one of the most dramatic geological settings for diving anywhere in the world. The caldera walls drop steeply underwater, with volcanic rock formations, lava tubes, and hot springs. The volcanic geology has created unique underwater topography — arches, chimneys, and caverns in dark volcanic rock. Marine life includes moray eels, octopus, grouper, and nudibranchs. The combination of the above-water caldera scenery and the underwater volcanic landscape makes Santorini a uniquely atmospheric dive destination.",
    conditions: 'Calm inside caldera. Visibility 40–100 ft. 68–79°F (seasonal). Mild current. All skill levels.',
    accessNotes: 'Several dive operators in Fira and Kamari. Fly to Santorini (JTR) or ferry from Athens. Best May–October.',
  },
  {
    name: 'Zakynthos — National Marine Park',
    location: 'Zakynthos (Zante), Ionian Islands, Greece',
    region: 'Ionian Islands',
    state: 'Ionian Islands',
    category: 'reef',
    latitude: 37.720, longitude: 20.870,
    maxDepthMeters: 30,
    description: "The premier diving in the Ionian Sea — underwater caves, blue holes, arches, and swimthroughs carved into white limestone cliffs. The island's south coast hosts the National Marine Park of Zakynthos, protecting loggerhead sea turtle (Caretta caretta) nesting beaches and the surrounding marine environment. Diving reveals vibrant Mediterranean marine life: moray eels, octopus, grouper, barracuda, and occasionally monk seals. The Keri Caves are the signature dive — light beams penetrating cave openings create cathedral effects.",
    conditions: 'Calm. Visibility 60–100 ft. 68–79°F (seasonal). All skill levels on most sites; advanced for cave penetration.',
    accessNotes: 'Fly to Zakynthos (ZTH) or ferry from Killini. Dive operators in Laganas and Zante Town. Best May–October.',
  },
];

// ── Malta ────────────────────────────────────────────────────────────────────
const MALTA_SITES: LibrarySite[] = [
  {
    name: 'Blue Hole — Gozo',
    location: 'Dwejra, Gozo, Malta',
    region: 'Gozo',
    state: 'Gozo',
    category: 'shore',
    latitude: 36.048, longitude: 14.189,
    maxDepthMeters: 40,
    description: "Malta's most famous dive site — a natural limestone sinkhole that opens at 8 m into the Mediterranean through a dramatic arch. Divers descend through the circular shaft, swim through the arch into the open sea, and explore the surrounding walls and chimney formations. Light effects through the arch are spectacular. The nearby former Azure Window (which collapsed in 2017) created an underwater rubble field now colonized by marine life. Octopus, moray eels, grouper, and barracuda are common. A world-class shore dive accessible year-round.",
    conditions: 'Shore entry. Visibility 60–130 ft. 62–79°F (seasonal). Some surge in winter. All skill levels for the hole; advanced for deeper exploration.',
    accessNotes: 'Ferry from Malta to Gozo (~25 min), then drive to Dwejra. Gear up at the car and walk to the entry. Malta has some of the best diving infrastructure in Europe.',
  },
  {
    name: 'HMS Maori Wreck',
    location: 'Marsamxett Harbour, Valletta, Malta',
    region: 'Valletta',
    state: 'Malta',
    category: 'wreck',
    latitude: 35.898, longitude: 14.504,
    maxDepthMeters: 15,
    description: "A WWII Tribal-class destroyer sunk by German bombing in 1942 during the Siege of Malta. The wreck lies in just 14 m in Marsamxett Harbour, making it one of the most accessible WWII wrecks in the Mediterranean. The hull structure, guns, and engine components are well preserved and encrusted with marine growth. The shallow depth and sheltered location make this an excellent wreck dive for all skill levels. Malta's strategic role in WWII is palpable diving among the wartime wreckage.",
    conditions: 'Calm harbour. Visibility 30–60 ft. 62–79°F. No significant current. All skill levels.',
    accessNotes: 'Shore entry or short boat ride from Sliema. Multiple operators. Year-round diving in Malta.',
  },
  {
    name: 'Um El Faroud Wreck',
    location: 'Wied iż-Żurrieq, Malta',
    region: 'South Malta',
    state: 'Malta',
    category: 'wreck',
    latitude: 35.822, longitude: 14.451,
    maxDepthMeters: 36,
    description: "A 110 m oil tanker sunk as an artificial reef in 1998 — one of the largest purpose-sunk wrecks in the Mediterranean. The ship sits upright on a sandy bottom with the deck at 18 m and the keel at 36 m. Fully penetrable with large open compartments, the engine room, bridge, and holds create an excellent multi-level wreck dive. Dense schools of damselfish, amberjacks, and barracuda surround the wreck. Night dives are atmospheric — the wreck transforms under torchlight.",
    conditions: 'Shore entry with surface swim. Visibility 40–100 ft. 62–79°F. Mild current. Intermediate to advanced.',
    accessNotes: 'Shore entry from Wied iż-Żurrieq near the Blue Grotto. Multiple operators. All-year diving.',
  },
];

// ── Croatia ──────────────────────────────────────────────────────────────────
const CROATIA_SITES: LibrarySite[] = [
  {
    name: 'Vis Island — Wreck Diving',
    location: 'Vis Island, Split-Dalmatia, Croatia',
    region: 'Central Dalmatia',
    state: 'Split-Dalmatia',
    category: 'wreck',
    latitude: 43.050, longitude: 16.180,
    maxDepthMeters: 40,
    description: "Croatia's premier wreck diving destination — the remote island of Vis was a military exclusion zone until 1989, preserving its underwater heritage. Multiple WWII wrecks include a B-24 Liberator bomber, a B-17 Flying Fortress, and several ships. The submarine base tunnels at Rukavac are a unique penetration dive. Beyond wrecks, Vis offers dramatic underwater topography: caves, arches, and walls along the limestone coast. The Adriatic's clearest water and Croatia's best marine biodiversity. The Blue Cave on nearby Biševo is an above-water attraction.",
    conditions: 'Calm in summer. Visibility 40–100 ft. 62–79°F (seasonal). Intermediate for wrecks.',
    accessNotes: 'Ferry from Split to Vis (~2.5 hrs). Dive operators in Vis town and Komiža. Best May–October.',
  },
  {
    name: 'Kornati National Park',
    location: 'Kornati Archipelago, Zadar, Croatia',
    region: 'Northern Dalmatia',
    state: 'Zadar',
    category: 'reef',
    latitude: 43.800, longitude: 15.300,
    maxDepthMeters: 40,
    description: "An archipelago of 89 islands and islets forming a national park — the most dramatic seascape in the Adriatic. The underwater world mirrors the barren, moonscape-like islands above: steep walls, caves, and overhangs populated by red gorgonians, Mediterranean fan mussels, grouper, scorpionfish, and octopus. The islands' isolation has preserved the marine environment. The Kornati walls — sheer cliffs dropping from the surface to 100+ m — are the signature geological feature. The absence of freshwater runoff produces exceptional visibility.",
    conditions: 'Some current between islands. Visibility 40–100 ft. 62–79°F. All skill levels on most sites.',
    accessNotes: 'Boat from Murter, Zadar, or Šibenik. National Park fee. Day trips or multi-day boat charters. Best May–October.',
  },
];

// ── Spain ────────────────────────────────────────────────────────────────────
const SPAIN_SITES: LibrarySite[] = [
  {
    name: 'Medes Islands Marine Reserve',
    location: 'L\'Estartit, Catalonia, Spain',
    region: 'Costa Brava',
    state: 'Catalonia',
    category: 'reef',
    latitude: 42.047, longitude: 3.222,
    maxDepthMeters: 30,
    description: "One of the most important marine protected areas in the western Mediterranean — the Medes Islands have been protected since 1983, producing fish populations dramatically larger than surrounding unprotected areas. Massive grouper (some over 1 m) approach divers fearlessly, enormous moray eels are abundant, and dense schools of barracuda, bream, and damselfish swarm the rocky islets. Spectacular caves and tunnels pierce the limestone islands. The Carall Bernat tunnel — a long swimthrough — is the signature dive. A textbook example of what Mediterranean marine protection can achieve.",
    conditions: 'Generally calm. Visibility 30–80 ft. 57–75°F (seasonal). All skill levels outside caves.',
    accessNotes: 'Boat from L\'Estartit (~10 min). Multiple operators. Dives are regulated — booking required. Best May–October. Marine reserve fee.',
  },
  {
    name: 'Cabo de Palos — Islas Hormigas Marine Reserve',
    location: 'Cabo de Palos, Murcia, Spain',
    region: 'Murcia Coast',
    state: 'Murcia',
    category: 'reef',
    latitude: 37.627, longitude: -0.655,
    maxDepthMeters: 40,
    description: "A chain of volcanic islets off Spain's southeast coast forming one of Europe's most spectacular marine reserves. The rocky pinnacles attract enormous schools of barracuda (sometimes thousands), amberjack, dentex, and bonito. Massive grouper, eagle rays, moray eels, and occasionally ocean sunfish (mola mola) and dolphins. The SS Sirio wreck (a luxury liner sunk in 1906 with tragic loss of life) adds a historical dimension. The combination of pelagic action, pristine pinnacles, and Mediterranean clarity makes this one of Spain's top dive sites.",
    conditions: 'Current on exposed sites. Visibility 30–80 ft. 57–77°F. Intermediate to advanced for pinnacles.',
    accessNotes: 'Boat from Cabo de Palos (~10 min). Several operators. Marine reserve — regulated access. Best May–November.',
  },
];

// ── Turkey ───────────────────────────────────────────────────────────────────
const TURKEY_SITES: LibrarySite[] = [
  {
    name: 'Kaş — Lycian Coast',
    location: 'Kaş, Antalya, Turkey',
    region: 'Turquoise Coast',
    state: 'Antalya',
    category: 'reef',
    latitude: 36.197, longitude: 29.640,
    maxDepthMeters: 40,
    description: "Turkey's premier dive destination on the Lycian coast — dramatic underwater topography with canyons, caverns, walls, and swimthroughs carved into limestone. The Canyon, a narrow underwater gorge dropping to 40 m, is the signature dive. An Italian WWII aircraft wreck, a British Douglas Dakota cargo plane, and several ancient amphora fields add archaeological interest. Loggerhead turtles, grouper, moray eels, and octopus populate the sites. The charming town of Kaş and nearby Lycian rock tombs make this a culturally rich diving base.",
    conditions: 'Calm coast. Visibility 60–130 ft. 62–82°F (seasonal). All skill levels on most sites.',
    accessNotes: 'Drive from Antalya (~4 hrs) or Dalaman (~2.5 hrs). Several dive operators in Kaş. Day trips to the Greek island of Meis (Kastellorizo) — 20 min by boat. Best April–November.',
  },
  {
    name: 'Gallipoli — WWII Wreck Diving',
    location: 'Gallipoli Peninsula, Çanakkale, Turkey',
    region: 'Dardanelles',
    state: 'Çanakkale',
    category: 'wreck',
    latitude: 40.240, longitude: 26.230,
    maxDepthMeters: 40,
    description: "The waters around the Gallipoli Peninsula hold the remains of Allied and Ottoman warships from the devastating 1915 campaign — one of the most significant naval battlegrounds of WWI. The wrecks of HMS Majestic, HMS Triumph, and several other vessels lie in diveable depths. The Lundy wreck (a British hospital ship) sits in 25 m. The battlefields above and below the water carry immense historical weight — for Australian, New Zealand, Turkish, British, and French divers, Gallipoli is sacred ground. The experience of diving warships beneath the ANZAC cliffs is deeply moving.",
    conditions: 'Current in the Dardanelles strait. Visibility 20–60 ft. 57–75°F (seasonal). Intermediate to advanced.',
    accessNotes: 'Drive from Istanbul (~4 hrs) or Çanakkale town. Licensed dive operators. Special permits required for some wreck sites. Historical battlefield tours complement the diving.',
  },
];

// ── Italy ────────────────────────────────────────────────────────────────────
const ITALY_SITES: LibrarySite[] = [
  {
    name: 'Portofino Marine Protected Area',
    location: 'Portofino, Liguria, Italy',
    region: 'Ligurian Coast',
    state: 'Liguria',
    category: 'reef',
    latitude: 44.300, longitude: 9.210,
    maxDepthMeters: 40,
    description: "Italy's most prestigious marine protected area — the promontory of Portofino drops steeply underwater to create dramatic walls covered in red gorgonian sea fans, the signature organism of the Mediterranean deep reef. The Cristo degli Abissi (Christ of the Abyss) — a bronze statue placed at 17 m in 1954 — is the most famous underwater statue in the world. Grouper, moray eels, scorpionfish, and nudibranchs populate the rocky reef. The elegant village of Portofino above makes this one of the most glamorous dive destinations in Europe.",
    conditions: 'Generally calm. Visibility 30–80 ft. 57–77°F (seasonal). All skill levels on most sites.',
    accessNotes: 'Boat from Portofino or Santa Margherita Ligure. Several operators. Marine park regulations and fees. Best May–October.',
  },
  {
    name: 'Ustica Island Marine Reserve',
    location: 'Ustica Island, Sicily, Italy',
    region: 'Sicily',
    state: 'Sicily',
    category: 'reef',
    latitude: 38.700, longitude: 13.180,
    maxDepthMeters: 40,
    description: "Italy's first marine protected area (1986) — a volcanic island north of Sicily with exceptional Mediterranean diving. The volcanic rock has eroded into dramatic arches, grottoes, and lava tunnels. Massive grouper (the island is famous for their size and fearlessness), amberjack, barracuda, moray eels, and a rich invertebrate community. The Grotta dei Gamberi (Shrimp Cave) and Scoglio del Medico (Doctor's Rock) are signature sites. Ustica's isolation and protection have made it a Mediterranean marine life hotspot.",
    conditions: 'Generally calm. Visibility 40–120 ft. 62–79°F. All skill levels on most sites.',
    accessNotes: 'Ferry or hydrofoil from Palermo (~90 min). Dive operators on the island. Best May–October.',
  },
];

// ── France ───────────────────────────────────────────────────────────────────
const FRANCE_SITES: LibrarySite[] = [
  {
    name: 'Port-Cros National Park',
    location: 'Port-Cros, Var, France',
    region: 'French Riviera',
    state: 'Provence-Alpes-Côte d\'Azur',
    category: 'reef',
    latitude: 43.003, longitude: 6.395,
    maxDepthMeters: 30,
    description: "One of the oldest marine national parks in the world (1963) — the island of Port-Cros off the French Riviera protects some of the healthiest Mediterranean reef in France. Dense Posidonia seagrass meadows (a UNESCO-significant habitat), rocky reefs covered in gorgonians, large grouper that are completely unafraid of divers, moray eels, barracuda, and nudibranchs. The Donator wreck, a 78 m cargo ship scuttled in 1945, lies nearby at 50 m and is one of the most popular wreck dives in France. The birthplace of modern recreational diving — Jacques Cousteau conducted many of his early experiments here.",
    conditions: 'Generally calm. Visibility 30–80 ft. 57–77°F. All skill levels on most reef sites.',
    accessNotes: 'Ferry from Hyères or Le Lavandou to Port-Cros island. Strict regulations — anchoring prohibited, no collecting. Several operators on the mainland. Best May–October.',
  },
  {
    name: 'Corsica — Réserve Naturelle de Scandola',
    location: 'Scandola, Corsica, France',
    region: 'Corsica',
    state: 'Corsica',
    category: 'reef',
    latitude: 42.370, longitude: 8.560,
    maxDepthMeters: 40,
    description: "A UNESCO World Heritage site on Corsica's west coast — dramatic red volcanic rock formations that continue underwater as walls, arches, and pinnacles. The reserve's strict protection since 1975 has produced exceptional marine life: enormous grouper, dense schools of dentex and barracuda, spiny lobster, and red coral in deeper waters. The red volcanic rock underwater creates a unique color palette not found elsewhere in the Mediterranean. The above-water scenery is equally spectacular — red cliffs, sea stacks, and osprey nests.",
    conditions: 'Some current. Visibility 40–100 ft. 57–77°F. All skill levels on outer sites.',
    accessNotes: 'Boat from Porto or Galeria on Corsica\'s west coast. Limited diving operators — strictly regulated access. Best May–October.',
  },
];

// ── Cyprus ───────────────────────────────────────────────────────────────────
const CYPRUS_SITES: LibrarySite[] = [
  {
    name: 'Zenobia Wreck',
    location: 'Larnaca, Cyprus',
    region: 'Larnaca',
    state: 'Larnaca',
    category: 'wreck',
    latitude: 34.892, longitude: 33.665,
    maxDepthMeters: 42,
    description: "One of the top 10 wreck dives in the world — a 178 m Swedish-built roll-on/roll-off ferry that capsized and sank on her maiden voyage in 1980. The Zenobia lies on her port side in 42 m, with trucks, trailers, and vending machines still in her vehicle decks. The scale is impressive — at nearly 10,000 tonnes, she is one of the largest accessible wrecks in the Mediterranean. The vehicle decks are penetrable and create dramatic swimthroughs between rows of trucks. Grouper, barracuda, jacks, and turtles congregate around the hull. A world-class wreck dive accessible year-round in warm, clear water.",
    conditions: 'Calm. Visibility 40–130 ft. 64–82°F. Mild current. All skill levels for outside; advanced for penetration.',
    accessNotes: 'Boat from Larnaca marina (~10 min). Multiple operators. Year-round diving — Cyprus has the warmest water in the Mediterranean. Fly to Larnaca (LCA).',
  },
];

// ── Portugal ─────────────────────────────────────────────────────────────────
const PORTUGAL_SITES: LibrarySite[] = [
  {
    name: 'Azores — Princess Alice Bank',
    location: 'Azores, Portugal (mid-Atlantic)',
    region: 'Azores',
    state: 'Azores',
    category: 'reef',
    latitude: 37.800, longitude: -29.200,
    maxDepthMeters: 35,
    description: "A submerged seamount in the mid-Atlantic, 80 km south of Faial Island, that rises from abyssal depths to within 35 m of the surface — creating one of Europe's most spectacular pelagic dive sites. Massive schools of mobula rays (devil rays) aggregate in summer (sometimes hundreds), along with blue sharks, mako sharks, whale sharks (rare), and enormous schools of jacks and barracuda. The seamount's isolation in the deep Atlantic produces encounters more reminiscent of Galápagos than Europe. The Azores also offer blue shark dives (reliable encounters with 6–10 animals per dive) from Faial, making this the best shark diving in Europe.",
    conditions: 'Open Atlantic, current. Visibility 40–100 ft. 64–75°F (seasonal). Advanced — open water, depth, current.',
    accessNotes: 'Fly to Faial (HOR) or São Miguel (PDL), Azores. Several dive operators. Princess Alice Bank trips weather-dependent (summer only). Blue shark dives available June–October.',
  },
  {
    name: 'Berlengas Islands',
    location: 'Peniche, Leiria, Portugal',
    region: 'Central Coast',
    state: 'Leiria',
    category: 'reef',
    latitude: 39.415, longitude: -9.510,
    maxDepthMeters: 30,
    description: "A UNESCO Biosphere Reserve archipelago off Portugal's central coast with dramatic underwater topography — granite arches, tunnels, and walls covered in colorful anemones, sea fans, and sponges. Large schools of bass, bream, and barracuda populate the rocky reef. Octopus, moray eels, and nudibranchs in abundance. The Berlengas are one of Portugal's most important seabird colonies (above water) and the underwater scenery matches. Clean Atlantic water and good visibility on calm days.",
    conditions: 'Atlantic swell possible. Visibility 20–60 ft. 57–68°F. Some current. Intermediate.',
    accessNotes: 'Boat from Peniche (~30 min). Dive operators in Peniche. Best May–October. Ferry to Berlenga Grande island for day visits.',
  },
];

// ── Canary Islands (Spain — Atlantic) ────────────────────────────────────────
const CANARY_ISLANDS_SITES: LibrarySite[] = [
  {
    name: 'El Hierro — Mar de las Calmas',
    location: 'La Restinga, El Hierro, Canary Islands, Spain',
    region: 'Canary Islands',
    state: 'Canary Islands',
    category: 'reef',
    latitude: 27.640, longitude: -17.990,
    maxDepthMeters: 40,
    description: "The smallest and most remote Canary Island has the best diving — the Mar de las Calmas (Sea of Calms) on El Hierro's sheltered southern coast is a marine reserve with volcanic underwater topography, crystal-clear water, and exceptional marine life. Large schools of barracuda, amberjack, and trumpetfish; manta rays and whale sharks (seasonal); angel sharks resting on sandy bottoms; and a rich variety of Atlantic and Mediterranean species. The volcanic arches, tunnels, and lava formations create dramatic swim-throughs. Europe's best year-round diving destination.",
    conditions: 'Calm (sheltered south coast). Visibility 40–130 ft. 64–75°F (seasonal). All skill levels.',
    accessNotes: 'Fly to El Hierro (VDE) from Tenerife or Gran Canaria. Dive operators in La Restinga. Year-round diving. Small, quiet island — a serious diver\'s destination.',
  },
  {
    name: 'Lanzarote — Museo Atlántico',
    location: 'Playa Blanca, Lanzarote, Canary Islands, Spain',
    region: 'Canary Islands',
    state: 'Canary Islands',
    category: 'reef',
    latitude: 28.860, longitude: -13.860,
    maxDepthMeters: 15,
    description: "Europe's first underwater sculpture museum — created by Jason deCaires Taylor (who also created Grenada's sculpture park) on the seabed at 12–15 m. Over 300 life-sized human sculptures arranged in themed installations: a raft of refugees, a playground, a garden wall. The sculptures are being colonized by marine life and serve as artificial reef. Angel sharks (a highlight of Canary Islands diving), stingrays, cuttlefish, and octopus inhabit the site. The volcanic black sand and the eerie human figures create a powerful underwater experience.",
    conditions: 'Calm. Visibility 30–80 ft. 64–72°F. All skill levels.',
    accessNotes: 'Boat from Playa Blanca (~5 min). Museo Atlántico operators handle access. Fly to Lanzarote (ACE) from UK/Europe.',
  },
];

// ── Combined export ──────────────────────────────────────────────────────────

export const MEDITERRANEAN_SITES: LibrarySite[] = [
  ...GREECE_SITES,
  ...MALTA_SITES,
  ...CROATIA_SITES,
  ...SPAIN_SITES,
  ...TURKEY_SITES,
  ...ITALY_SITES,
  ...FRANCE_SITES,
  ...CYPRUS_SITES,
  ...PORTUGAL_SITES,
  ...CANARY_ISLANDS_SITES,
];

export const MEDITERRANEAN_COUNTRY_MAP: { sites: LibrarySite[]; country: string }[] = [
  { sites: GREECE_SITES,           country: 'Greece'         },
  { sites: MALTA_SITES,            country: 'Malta'          },
  { sites: CROATIA_SITES,          country: 'Croatia'        },
  { sites: SPAIN_SITES,            country: 'Spain'          },
  { sites: TURKEY_SITES,           country: 'Turkey'         },
  { sites: ITALY_SITES,            country: 'Italy'          },
  { sites: FRANCE_SITES,           country: 'France'         },
  { sites: CYPRUS_SITES,            country: 'Cyprus'         },
  { sites: PORTUGAL_SITES,         country: 'Portugal'       },
  { sites: CANARY_ISLANDS_SITES,   country: 'Canary Islands' },
];
