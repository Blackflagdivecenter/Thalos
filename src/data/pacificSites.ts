/**
 * Pacific Islands Dive Site Library
 *
 * Covers: Palau, Micronesia (FSM), Marshall Islands, Fiji,
 * Solomon Islands, Tonga, French Polynesia, Hawaii (separate from US mainland),
 * Galápagos is under South America.
 */

import { LibrarySite } from './usSites';

// ── Palau ────────────────────────────────────────────────────────────────────
const PALAU_SITES: LibrarySite[] = [
  {
    name: 'Blue Corner',
    location: 'Ngemelis Island, Rock Islands, Palau',
    region: 'Rock Islands',
    state: 'Koror',
    category: 'reef',
    latitude: 7.100, longitude: 134.220,
    maxDepthMeters: 30,
    description: "Consistently rated among the top 5 dive sites in the world — a submerged reef promontory where two ocean currents converge, creating a nutrient highway that attracts staggering marine life. Grey reef sharks, whitetip sharks, napoleon wrasse, bumphead parrotfish, eagle rays, barracuda tornados, and manta rays are all common on a single dive. Divers hook into the reef and hover in the current like human kites, watching the parade. The density and variety of large marine life here is almost unbelievable. A bucket-list dive for every serious diver.",
    conditions: 'Strong current (reef hooks used). Visibility 60–130 ft. 82–86°F. Intermediate to advanced.',
    accessNotes: 'Day boat from Koror (~45 min). Fly to Palau (ROR) from Guam, Manila, Seoul, or Taipei. Many dive operators in Koror. Palau is a marine sanctuary — all waters are protected.',
  },
  {
    name: 'Jellyfish Lake',
    location: 'Eil Malk Island, Rock Islands, Palau',
    region: 'Rock Islands',
    state: 'Koror',
    category: 'lake',
    latitude: 7.161, longitude: 134.376,
    maxDepthMeters: 5,
    description: "The most famous jellyfish lake in the world — a marine lake containing millions of golden jellyfish that have evolved in isolation for thousands of years, losing their sting. Snorkelers swim through pulsing clouds of jellyfish so dense they fill the field of vision. The jellyfish migrate across the lake daily following the sun. The lake was temporarily closed in 2016 due to El Niño-related jellyfish population decline but has recovered. Scuba is not permitted (bubbles damage the lake's chemistry). One of nature's most surreal and gentle experiences.",
    conditions: 'Calm lake. Warm, brackish water. Snorkel only — no scuba permitted. All skill levels.',
    accessNotes: 'Boat from Koror (~30 min) to Eil Malk, then short jungle hike to the lake. Included on most Rock Islands tours. Palau Rock Islands permit required (separate from marine park fee).',
  },
  {
    name: 'German Channel — Manta Station',
    location: 'German Channel, Rock Islands, Palau',
    region: 'Rock Islands',
    state: 'Koror',
    category: 'reef',
    latitude: 7.088, longitude: 134.228,
    maxDepthMeters: 20,
    description: "A man-made channel cut through the reef by German phosphate miners in the early 1900s — now one of the world's most reliable manta ray cleaning stations. Divers settle on a sandy bottom at the channel's entrance and wait as reef manta rays arrive for cleaning, circling repeatedly overhead at close range. Multiple mantas often present simultaneously. The surrounding reef is excellent — large coral bommies with Napoleon wrasse, reef sharks, and dense fish schools. Often combined with Blue Corner for an epic day of diving.",
    conditions: 'Current varies with tide. Visibility 40–80 ft. 82–86°F. All skill levels on the sand station.',
    accessNotes: 'Day boat from Koror. Usually combined with Blue Corner or Big Drop-off. Best October–May for manta activity.',
  },
];

// ── Micronesia (FSM) ─────────────────────────────────────────────────────────
const MICRONESIA_SITES: LibrarySite[] = [
  {
    name: 'Chuuk Lagoon (Truk Lagoon)',
    location: 'Chuuk State, Federated States of Micronesia',
    region: 'Chuuk',
    state: 'Chuuk',
    category: 'wreck',
    latitude: 7.415, longitude: 151.848,
    maxDepthMeters: 40,
    description: "The greatest wreck diving destination on Earth — a sheltered lagoon containing the remains of an entire Japanese naval fleet destroyed during Operation Hailstone on February 17–18, 1944. Over 60 ships and 275 aircraft were sunk. Today, approximately 40 wrecks are diveable, ranging from submarines and destroyers to transport ships and aircraft. The wrecks are heavily encrusted with soft corals, sponges, and hard coral. Many still contain wartime artifacts — tanks, trucks, ammunition, personal effects, sake bottles, and aircraft engines. Swimming through the hold of a WWII ship 80 years after it sank, surrounded by coral-encrusted weaponry, is an experience without parallel.",
    conditions: 'Calm lagoon. Visibility 30–100 ft. 82–86°F. All skill levels for exterior; Advanced for penetration.',
    accessNotes: 'Fly to Chuuk (TKK) via Guam on United Island Hopper route. A handful of dive operators and liveaboards. Remote — limited infrastructure. Many divers stay on liveaboards in the lagoon.',
  },
  {
    name: 'Yap — Manta Ray Dives',
    location: 'Yap, Federated States of Micronesia',
    region: 'Yap',
    state: 'Yap',
    category: 'reef',
    latitude: 9.515, longitude: 138.125,
    maxDepthMeters: 20,
    description: "One of the few places in the world where manta rays can be seen year-round — Yap's channels funnel plankton-rich water past established cleaning stations that mantas have used for generations. Divers descend to sandy viewing areas and watch mantas arrive, circle, and hover for cleaning. The predictability (almost every dive produces mantas) and the respectful observation protocols (strict no-touch rules enforced since the 1990s) make Yap a model for sustainable manta tourism. The island's Stone Money culture adds a remarkable above-water dimension.",
    conditions: 'Current in channels. Visibility 30–80 ft. 82–86°F. All skill levels at cleaning stations.',
    accessNotes: 'Fly to Yap (YAP) via Guam on United. Two main dive operators. Small island with basic accommodation. One of the most remote dive destinations easily accessible by commercial air.',
  },
  {
    name: 'Pohnpei — Ant Atoll & Pakin Atoll',
    location: 'Pohnpei, Federated States of Micronesia',
    region: 'Pohnpei',
    state: 'Pohnpei',
    category: 'reef',
    latitude: 6.880, longitude: 158.230,
    maxDepthMeters: 30,
    description: "The least-visited major dive destination in Micronesia — Pohnpei's barrier reef and the offshore atolls of Ant and Pakin offer pristine, virtually undived reef walls and channels. The passes through Ant Atoll are swept by current that brings grey reef sharks, eagle rays, barracuda, and tuna in impressive numbers. The lagoon reefs are covered in healthy hard coral with extraordinary fish diversity. Pohnpei is also home to Nan Madol — a mysterious ancient city of stone built on 92 artificial islands, one of the great archaeological wonders of the Pacific. A frontier dive destination with deep cultural history.",
    conditions: 'Current in passes. Visibility 40–100 ft. 82–86°F. Intermediate on outer reefs.',
    accessNotes: 'Fly to Pohnpei (PNI) via Guam or Honolulu on United Island Hopper. One or two dive operators. Very limited tourism infrastructure. Remote and uncrowded.',
  },
];

// ── Marshall Islands ─────────────────────────────────────────────────────────
const MARSHALL_ISLANDS_SITES: LibrarySite[] = [
  {
    name: 'Bikini Atoll — Nuclear Fleet',
    location: 'Bikini Atoll, Marshall Islands',
    region: 'Bikini Atoll',
    state: 'Bikini Atoll',
    category: 'wreck',
    latitude: 11.600, longitude: 165.550,
    maxDepthMeters: 55,
    description: "The most extraordinary wreck diving destination on Earth — a fleet of target ships sunk during US nuclear weapons testing in 1946 (Operations Crossroads). The USS Saratoga (270 m aircraft carrier), HIJMS Nagato (flagship of the Pearl Harbor attack), USS Arkansas (battleship), and other vessels lie in 40–55 m of crystal-clear lagoon water. The Saratoga is the largest diveable shipwreck in the world. Bikini Atoll was declared safe for diving (the water is not radioactive) in the 1990s. The combination of historical significance, scale, and pristine conditions is unmatched.",
    conditions: 'Calm lagoon. Visibility 80–150 ft. 82–86°F. Deep — technical/advanced divers only. Deco diving.',
    accessNotes: 'Charter flight from Majuro to Bikini Atoll (limited schedule). One operator runs diving seasons. Extremely remote and expensive. Radiation monitoring confirms safety. Book 12+ months ahead.',
  },
];

// ── Fiji ─────────────────────────────────────────────────────────────────────
const FIJI_SITES: LibrarySite[] = [
  {
    name: 'Great Astrolabe Reef — Kadavu',
    location: 'Kadavu Island, Fiji',
    region: 'Kadavu',
    state: 'Kadavu',
    category: 'reef',
    latitude: -19.050, longitude: 178.300,
    maxDepthMeters: 30,
    description: "The fourth largest barrier reef in the world, encircling Kadavu Island with over 100 km of pristine reef wall. Known as the 'Soft Coral Capital of the World' — the walls and overhangs are draped in soft corals of every imaginable color: pinks, purples, oranges, reds, and yellows that create an effect more like a garden than a reef. Manta rays visit cleaning stations on the reef (June–October), reef sharks patrol the walls, and the fish diversity is exceptional. Far less visited than Fiji's northern resorts.",
    conditions: 'Current on outer walls. Visibility 40–100 ft. 79–84°F. All skill levels inside the lagoon.',
    accessNotes: 'Fly from Suva or Nadi to Kadavu (KDV). A handful of eco-lodges with dive operations. Remote — limited infrastructure. Manta season June–October.',
  },
  {
    name: 'Beqa Lagoon — Shark Reef Marine Reserve',
    location: 'Pacific Harbour, Viti Levu, Fiji',
    region: 'Beqa Lagoon',
    state: 'Viti Levu',
    category: 'reef',
    latitude: -18.340, longitude: 178.020,
    maxDepthMeters: 30,
    description: "Fiji's most famous shark dive — a structured feeding dive where up to 8 species of shark are encountered on a single dive: bull sharks (the main attraction, up to 3.5 m), tiger sharks, grey reef sharks, whitetip reef sharks, blacktip reef sharks, tawny nurse sharks, silvertip sharks, and occasionally great hammerheads. Divers kneel behind a low wall as the sharks are fed. The Shark Reef Marine Reserve was created by the dive operator and the local village, who receive tourism income — a successful conservation model that has increased shark populations dramatically.",
    conditions: 'Calm lagoon. Visibility 40–80 ft. 79–84°F. All skill levels with the operator.',
    accessNotes: 'Boat from Pacific Harbour, Viti Levu (~30 min). 2–3 hour drive from Nadi. Beqa Adventure Divers is the primary operator. Shark dives run daily.',
  },
  {
    name: 'Rainbow Reef — Taveuni',
    location: 'Somosomo Strait, Taveuni, Fiji',
    region: 'Taveuni',
    state: 'Taveuni',
    category: 'reef',
    latitude: -16.800, longitude: -179.900,
    maxDepthMeters: 30,
    description: "The Somosomo Strait between Taveuni and Vanua Levu funnels nutrient-rich water across Rainbow Reef — creating the most colorful soft coral display in Fiji. The Great White Wall, where the reef wall is covered in white soft corals that glow luminescent in the blue, is one of the most photographed dive sites in the South Pacific. Purple Wall, Yellow Wall, and Annie's Bommie offer equally spectacular color. The concentration of soft coral in every shade makes this the crown jewel of Fiji diving.",
    conditions: 'Current in the strait — tide-dependent diving. Visibility 30–80 ft. 79–84°F. Intermediate.',
    accessNotes: 'Fly to Taveuni (TVU) from Nadi or Suva. Dive resorts on Taveuni. Dives timed to current/tide. Best May–October (dry season, better visibility).',
  },
];

// ── Solomon Islands ──────────────────────────────────────────────────────────
const SOLOMON_ISLANDS_SITES: LibrarySite[] = [
  {
    name: 'Marovo Lagoon',
    location: 'Marovo Lagoon, Western Province, Solomon Islands',
    region: 'Western Province',
    state: 'Western Province',
    category: 'reef',
    latitude: -8.450, longitude: 158.200,
    maxDepthMeters: 30,
    description: "The largest double barrier-reef-enclosed lagoon in the world — a UNESCO World Heritage-nominated site with extraordinary reef diversity and WWII wrecks. The Solomon Islands sit within the Coral Triangle and the reefs show it: dense hard coral gardens, massive table corals, and healthy soft coral walls. Japanese and Allied WWII wrecks (aircraft, ships, landing craft) are scattered throughout the islands. The combination of pristine reefs, wartime history, and cultural authenticity in the Solomons is unique. Dugongs inhabit the lagoon — one of the few remaining populations in the Pacific.",
    conditions: 'Calm lagoon. Visibility 30–100 ft. 82–86°F. All skill levels inside the lagoon.',
    accessNotes: 'Fly to Honiara (HIR), then domestic flight or boat to Marovo. A few eco-lodges with dive operations. Remote — bring essentials. Liveaboards also operate in the Solomons.',
  },
  {
    name: 'Iron Bottom Sound',
    location: 'Guadalcanal, Solomon Islands',
    region: 'Guadalcanal',
    state: 'Guadalcanal',
    category: 'wreck',
    latitude: -9.100, longitude: 159.950,
    maxDepthMeters: 40,
    description: "Named for the extraordinary number of warships sunk during the Guadalcanal Campaign (1942–43) — one of the bloodiest naval engagements of the Pacific War. The sound contains dozens of Allied and Japanese warships, transports, and aircraft. Several wrecks are accessible to recreational divers, including Japanese transport ships and US landing craft. The deeper wrecks require technical diving. Coral growth on the shallower wrecks is extraordinary after 80+ years. A pilgrimage site for wreck divers and WWII history enthusiasts.",
    conditions: 'Variable — sheltered in parts, exposed in others. Visibility 20–80 ft. 82–86°F. Intermediate to advanced.',
    accessNotes: 'Dive operators in Honiara. Fly to Honiara (HIR). Limited infrastructure. Combine with Marovo Lagoon or Russell Islands for a broader Solomons experience.',
  },
];

// ── Tonga ────────────────────────────────────────────────────────────────────
const TONGA_SITES: LibrarySite[] = [
  {
    name: 'Vava\'u — Humpback Whale Swimming',
    location: 'Vava\'u Group, Tonga',
    region: 'Vava\'u',
    state: 'Vava\'u',
    category: 'reef',
    latitude: -18.650, longitude: -173.980,
    maxDepthMeters: 15,
    description: "One of very few places in the world where swimming with humpback whales is legal and supported by a well-managed tourism industry. From July to October, humpback whales migrate to Tonga's warm, sheltered waters to calve and mate. Under licensed operators, snorkelers enter the water (no scuba) with mothers and calves, curious juveniles, and singing males. The whales' tolerance and curiosity — a 15 m animal turning to make eye contact at 3 m range — creates what many describe as the most profound wildlife encounter of their lives.",
    conditions: 'Open water, mild swell. 75–79°F. Snorkel only. All swim levels.',
    accessNotes: 'Fly to Vava\'u (VAV) from Tongatapu or Auckland. Licensed whale swim operators depart daily July–October. Book ahead — permits are limited. Accommodation in Neiafu town.',
  },
];

// ── French Polynesia ─────────────────────────────────────────────────────────
const FRENCH_POLYNESIA_SITES: LibrarySite[] = [
  {
    name: 'Rangiroa — Tiputa Pass',
    location: 'Rangiroa Atoll, Tuamotu, French Polynesia',
    region: 'Tuamotu Archipelago',
    state: 'Tuamotu',
    category: 'reef',
    latitude: -14.953, longitude: -147.632,
    maxDepthMeters: 30,
    description: "One of the world's greatest drift dives — a channel connecting the open Pacific to the interior of the world's second largest coral atoll. The incoming tide carries divers through the pass alongside grey reef sharks (often 100+), dolphins, eagle rays, manta rays, hammerhead sharks, and vast schools of barracuda and jacks. The shark density in Tiputa Pass is among the highest in the world. Napoleon wrasse the size of refrigerators cruise the walls. The volume of life funneled through this narrow passage is genuinely overwhelming.",
    conditions: 'Strong current (drift dive). Visibility 60–130 ft. 79–84°F. Intermediate to advanced.',
    accessNotes: 'Fly from Tahiti (PPT) to Rangiroa (RGI) ~1 hr. Several dive resorts and pensions. Dives timed to incoming tide. Best January–March for hammerheads.',
  },
  {
    name: 'Fakarava — South Pass (Tetamanu)',
    location: 'Fakarava Atoll, Tuamotu, French Polynesia',
    region: 'Tuamotu Archipelago',
    state: 'Tuamotu',
    category: 'reef',
    latitude: -16.670, longitude: -145.400,
    maxDepthMeters: 30,
    description: "A UNESCO Biosphere Reserve and home to what may be the densest concentration of grey reef sharks on Earth. The narrow South Pass (Tetamanu) funnels hundreds of grey reef sharks into a wall of fins and teeth — during June–July spawning aggregations, 600–700 sharks have been counted in the pass simultaneously. Beyond the sharks, the pass walls are covered in pristine hard coral, and the fish biomass is staggering. Fakarava represents what a healthy, unfinished Pacific reef looks like when left alone.",
    conditions: 'Strong current (drift dive). Visibility 60–130 ft. 79–84°F. Intermediate to advanced.',
    accessNotes: 'Fly from Tahiti to Fakarava (FAV). A few small pensions and dive operators. South Pass is ~1 hr boat ride from the village. Remote — bring cash, limited infrastructure.',
  },
  {
    name: 'Moorea — Opunohu Bay',
    location: 'Moorea, Society Islands, French Polynesia',
    region: 'Society Islands',
    state: 'Windward Islands',
    category: 'reef',
    latitude: -17.490, longitude: -149.850,
    maxDepthMeters: 20,
    description: "Moorea's dramatic volcanic peaks plunging into turquoise lagoons create one of the most scenic dive settings in the world. The reef passes and outer reef slopes host blacktip reef sharks, lemon sharks, stingrays, eagle rays, humpback whales (July–October), and healthy coral gardens. The Tiki — a submerged statue placed at 18 m — is the signature site. Moorea's proximity to Tahiti and the combination of above-water scenery with good reef diving make it the most accessible Polynesian dive experience.",
    conditions: 'Calm lagoon, some current in passes. Visibility 30–80 ft. 79–84°F. All skill levels.',
    accessNotes: 'Ferry from Tahiti (~30 min) or short flight. Multiple dive operators. Easy access from Papeete.',
  },
];

// ── Vanuatu ──────────────────────────────────────────────────────────────────
const VANUATU_SITES: LibrarySite[] = [
  {
    name: 'SS President Coolidge',
    location: 'Espiritu Santo, Vanuatu',
    region: 'Espiritu Santo',
    state: 'Sanma',
    category: 'wreck',
    latitude: -15.519, longitude: 167.176,
    maxDepthMeters: 70,
    description: "The largest easily accessible wreck dive in the world — a 199 m luxury ocean liner converted to a troop transport that struck two US-laid mines while entering the harbor on October 26, 1942. The ship lies on her port side in 20–70 m, with the bow accessible at recreational depths and deeper sections for technical divers. Inside, The Lady (a large porcelain figurine in the first-class salon) is the most famous artifact. Chandeliers, mosaic tiles, helmets, ammunition, jeeps, and medical supplies remain scattered throughout. The scale, history, and shore accessibility (5-minute swim from the beach) make this one of the greatest wreck dives on Earth.",
    conditions: 'Shore entry. Visibility 30–80 ft. 79–84°F. Mild current. All skill levels for shallow bow; advanced for penetration and deep sections.',
    accessNotes: 'Fly to Espiritu Santo (SON) from Port Vila. Several dive operators in Luganville. Shore entry — the wreck is just offshore. Extraordinary value for a world-class wreck.',
  },
  {
    name: 'Million Dollar Point',
    location: 'Espiritu Santo, Vanuatu',
    region: 'Espiritu Santo',
    state: 'Sanma',
    category: 'wreck',
    latitude: -15.466, longitude: 167.206,
    maxDepthMeters: 30,
    description: "After WWII, the US military dumped millions of dollars worth of equipment into the sea rather than transport it home — trucks, bulldozers, cranes, forklifts, Coca-Cola bottles, and aircraft parts. The result is a surreal underwater junkyard stretching from the shallows to 30+ m, now heavily colonized by coral and marine life. Snorkelers can see trucks in 3 m of water. The waste was so extensive it formed a new section of coastline. A fascinating and uniquely accessible window into wartime excess.",
    conditions: 'Shore entry, calm. Visibility 20–60 ft. 79–84°F. All skill levels.',
    accessNotes: 'Short drive from Luganville, shore entry. Often combined with the Coolidge.',
  },
];

// ── New Caledonia ────────────────────────────────────────────────────────────
const NEW_CALEDONIA_SITES: LibrarySite[] = [
  {
    name: 'New Caledonia Barrier Reef Lagoon',
    location: 'Nouméa, New Caledonia',
    region: 'Grand Terre',
    state: 'South Province',
    category: 'reef',
    latitude: -22.270, longitude: 166.440,
    maxDepthMeters: 30,
    description: "The world's largest enclosed lagoon — 24,000 km² enclosed by the second-longest barrier reef on Earth (1,600 km), surpassed only by Australia's GBR. A UNESCO World Heritage site with exceptional marine biodiversity: dugongs, green sea turtles, nautilus (living fossils), tiger sharks, manta rays, and over 1,000 fish species. The lagoon's enormous size means most of it is rarely or never dived. The Prony Needle — a hydrothermal chimney rising from the lagoon floor — is a uniquely surreal dive. French infrastructure and cuisine make this a comfortable, uncrowded alternative to the GBR.",
    conditions: 'Calm lagoon. Visibility 30–80 ft. 72–82°F (seasonal). All skill levels inside the lagoon.',
    accessNotes: 'Fly to Nouméa (NOU) from Sydney, Auckland, Tokyo, or Paris. Dive operators in Nouméa. Liveaboards explore the remote northern lagoon. French territory — EUR accepted.',
  },
];

// ── Guam ─────────────────────────────────────────────────────────────────────
const GUAM_SITES: LibrarySite[] = [
  {
    name: 'Blue Hole & Crevice',
    location: 'Orote Peninsula, Guam',
    region: 'Guam',
    state: 'Guam',
    category: 'reef',
    latitude: 13.440, longitude: 144.630,
    maxDepthMeters: 40,
    description: "Guam's most famous dive site — a vertical shaft in the reef that drops to 40 m before opening through a window in the wall to the open ocean. The blue hole effect — looking up from inside the shaft at the light above — is mesmerizing. WWII wrecks are scattered around the island (Japanese and American), including the Tokai Maru and SMS Cormoran — two enemy vessels from different wars lying side by side, the only dive site in the world where you can touch two warships from opposing sides of two different conflicts simultaneously.",
    conditions: 'Current on exposed sites. Visibility 40–100 ft. 82–86°F. Intermediate for the Blue Hole.',
    accessNotes: 'Fly to Guam (GUM) from Tokyo, Seoul, Manila, or Honolulu. Multiple dive operators. US territory — no visa needed for US citizens.',
  },
];

// ── Samoa ────────────────────────────────────────────────────────────────────
const SAMOA_SITES: LibrarySite[] = [
  {
    name: 'Palolo Deep Marine Reserve',
    location: 'Apia, Samoa',
    region: 'Upolu',
    state: 'Upolu',
    category: 'reef',
    latitude: -13.850, longitude: -171.770,
    maxDepthMeters: 20,
    description: "A marine reserve just offshore from Samoa's capital with a natural hole in the reef that drops to 20 m — creating a blue hole effect surrounded by healthy coral gardens. Samoa's reefs are uncrowded and largely unexplored by international divers. The annual palolo worm rising (October–November) is a spectacular natural event. Giant clams, reef sharks, turtles, and pristine hard coral. The Polynesian cultural experience — village life, traditional fale accommodation, umu feasts — makes Samoa unlike any other dive trip.",
    conditions: 'Calm inside the reef. Visibility 20–60 ft. 82–86°F. All skill levels.',
    accessNotes: 'Fly to Apia (APW) from Auckland or Fiji. Limited dive operators. Very affordable. Best May–October (dry season).',
  },
];

// ── Cook Islands ─────────────────────────────────────────────────────────────
const COOK_ISLANDS_SITES: LibrarySite[] = [
  {
    name: 'Rarotonga — Reef & Humpback Whales',
    location: 'Rarotonga, Cook Islands',
    region: 'Rarotonga',
    state: 'Rarotonga',
    category: 'reef',
    latitude: -21.230, longitude: -159.780,
    maxDepthMeters: 25,
    description: "A volcanic island surrounded by a fringing reef with clear Pacific water and excellent marine life. The outer reef drops into deep blue, attracting humpback whales (July–October), reef sharks, turtles, and eagle rays. The shallow lagoon offers easy snorkeling over coral gardens. Diving here is relaxed and uncrowded — the Cook Islands receive a tiny fraction of the visitors of French Polynesia despite similarly clear water and healthy reefs. The Polynesian hospitality and the island's relaxed pace create an authentic South Pacific experience.",
    conditions: 'Calm on the sheltered side. Visibility 30–80 ft. 75–82°F. Mild current on outer reef. All skill levels.',
    accessNotes: 'Fly to Rarotonga (RAR) from Auckland (~3.5 hrs). A couple of dive operators. Budget-friendly. Best April–November.',
  },
];

// ── Combined export ──────────────────────────────────────────────────────────

export const PACIFIC_SITES: LibrarySite[] = [
  ...PALAU_SITES,
  ...MICRONESIA_SITES,
  ...MARSHALL_ISLANDS_SITES,
  ...FIJI_SITES,
  ...SOLOMON_ISLANDS_SITES,
  ...TONGA_SITES,
  ...FRENCH_POLYNESIA_SITES,
  ...VANUATU_SITES,
  ...NEW_CALEDONIA_SITES,
  ...GUAM_SITES,
  ...SAMOA_SITES,
  ...COOK_ISLANDS_SITES,
];

export const PACIFIC_COUNTRY_MAP: { sites: LibrarySite[]; country: string }[] = [
  { sites: PALAU_SITES,             country: 'Palau'             },
  { sites: MICRONESIA_SITES,        country: 'Micronesia'        },
  { sites: MARSHALL_ISLANDS_SITES,  country: 'Marshall Islands'  },
  { sites: FIJI_SITES,              country: 'Fiji'              },
  { sites: SOLOMON_ISLANDS_SITES,   country: 'Solomon Islands'   },
  { sites: TONGA_SITES,             country: 'Tonga'             },
  { sites: FRENCH_POLYNESIA_SITES,  country: 'French Polynesia'  },
  { sites: VANUATU_SITES,           country: 'Vanuatu'           },
  { sites: NEW_CALEDONIA_SITES,     country: 'New Caledonia'     },
  { sites: GUAM_SITES,              country: 'Guam'              },
  { sites: SAMOA_SITES,             country: 'Samoa'             },
  { sites: COOK_ISLANDS_SITES,      country: 'Cook Islands'      },
];
