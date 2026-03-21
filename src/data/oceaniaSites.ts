/**
 * Oceania Dive Site Library
 *
 * Covers: Australia, New Zealand, Papua New Guinea.
 */

import { LibrarySite } from './usSites';

// ── Australia ────────────────────────────────────────────────────────────────
const AUSTRALIA_SITES: LibrarySite[] = [
  {
    name: 'Great Barrier Reef — Cod Hole',
    location: 'Ribbon Reefs, Far North Queensland, Australia',
    region: 'Great Barrier Reef',
    state: 'Queensland',
    category: 'reef',
    latitude: -14.668, longitude: 145.591,
    maxDepthMeters: 25,
    description: "The signature dive of the Great Barrier Reef — a site on the outer Ribbon Reefs where enormous potato cod (up to 100 kg and 1.5 m long) approach divers for interaction. These gentle giants are completely habituated and allow close approach, sometimes resting on divers' laps. The surrounding reef is classic outer Great Barrier Reef: pristine hard coral, giant clams, reef sharks, and extraordinary fish diversity. The GBR is the largest coral reef system on Earth (2,300 km long) and a UNESCO World Heritage site. Cod Hole captures the best of what makes it special.",
    conditions: 'Mild current. Visibility 40–100 ft. 75–82°F. All skill levels.',
    accessNotes: 'Liveaboard from Cairns (2–3 day trip to Ribbon Reefs). Cod Hole is too far for day trips from Cairns. Several liveaboard operators. Best June–November.',
  },
  {
    name: 'Great Barrier Reef — Osprey Reef',
    location: 'Osprey Reef, Coral Sea, Queensland, Australia',
    region: 'Coral Sea',
    state: 'Queensland',
    category: 'reef',
    latitude: -13.880, longitude: 146.560,
    maxDepthMeters: 40,
    description: "A remote coral sea atoll 350 km northeast of Cairns — the most spectacular wall diving on the Great Barrier Reef. The North Horn shark feed is legendary: grey reef sharks, whitetip reef sharks, silvertip sharks, and occasionally hammerheads gather in large numbers at a feeding site on the wall's edge. The wall itself drops from a shallow lagoon into abyssal depths, decorated with pristine soft corals and gorgonians. Visibility regularly exceeds 100 ft in the clear Coral Sea water. A dramatic step up from the inner GBR.",
    conditions: 'Current on walls. Visibility 60–150 ft. 75–82°F. Intermediate to advanced.',
    accessNotes: 'Liveaboard from Cairns only (overnight crossing). 3–7 day Coral Sea liveaboard itineraries. Several operators.',
  },
  {
    name: 'SS Yongala Wreck',
    location: 'Cape Bowling Green, Queensland, Australia',
    region: 'Central Queensland',
    state: 'Queensland',
    category: 'wreck',
    latitude: -19.306, longitude: 147.622,
    maxDepthMeters: 30,
    description: "Widely regarded as the best wreck dive in Australia and one of the top 10 in the world. The SS Yongala sank in a cyclone in 1911 with all 122 souls aboard — her location was unknown for 47 years. The 109 m passenger ship now lies on her side in 30 m and has become one of the most prolific artificial reefs on the planet. Giant grouper, bull sharks, manta rays, sea snakes, turtles, eagle rays, and enormous schools of trevally and batfish surround the wreck. The marine life density is genuinely overwhelming. A heritage-listed site and a must-dive.",
    conditions: 'Current can be strong. Visibility 20–60 ft. 75–82°F. Intermediate to advanced.',
    accessNotes: 'Day boat from Alva Beach or Ayr (~2 hrs south of Townsville). Several operators. Weather dependent — swell can prevent diving. Best March–November.',
  },
  {
    name: 'Navy Pier — Exmouth',
    location: 'Exmouth, Western Australia',
    region: 'Ningaloo Coast',
    state: 'Western Australia',
    category: 'shore',
    latitude: -21.815, longitude: 114.165,
    maxDepthMeters: 12,
    description: "Consistently rated the best shore dive in Australia — an active military pier whose pylons support an extraordinarily dense marine ecosystem. Giant grouper (Queensland groper, up to 300 kg), massive schools of trevally, grey reef sharks, wobbegong sharks, octopus, nudibranchs, lionfish, and mating cuttlefish in season. The pier creates a micro-reef in 12 m of warm Ningaloo water. The density and size of marine life under this pier defies belief. Requires defence base access permit (arranged through dive operators). Nearby Ningaloo Reef offers whale shark swims (March–July).",
    conditions: 'Calm. Visibility 15–40 ft. 72–82°F. Mild current. All skill levels.',
    accessNotes: 'Defence base access required — arranged through Exmouth dive operators (advance booking essential). Nearby Ningaloo Reef for whale shark swims. Fly to Learmonth (LEA) or drive from Perth (~12 hrs).',
  },
  {
    name: 'Ningaloo Reef — Whale Shark Swims',
    location: 'Ningaloo Coast, Western Australia',
    region: 'Ningaloo Coast',
    state: 'Western Australia',
    category: 'reef',
    latitude: -22.690, longitude: 113.680,
    maxDepthMeters: 15,
    description: "Australia's best whale shark encounter and one of the most reliable in the world. Every year from March to July, whale sharks gather along the 300 km Ningaloo Reef to feed on coral spawn and plankton. Spotter planes locate the sharks and snorkelers enter the water for supervised encounters. The warm, clear water and the reef's proximity to shore (sometimes just 100 m from the beach) make encounters comfortable and intimate. Humpback whales (August–October) and manta rays are also available as swim-with encounters. Ningaloo is the most accessible large reef system in the world.",
    conditions: 'Calm, sheltered coast. Visibility 20–60 ft. 72–82°F. Snorkel (whale sharks) and scuba (reef). All skill levels.',
    accessNotes: 'Fly to Learmonth (LEA) or drive from Perth. Operators in Exmouth and Coral Bay. Whale shark season March–July; humpback whale swims August–October; manta rays year-round.',
  },
  {
    name: 'Julian Rocks — Byron Bay',
    location: 'Byron Bay, New South Wales, Australia',
    region: 'North Coast NSW',
    state: 'New South Wales',
    category: 'reef',
    latitude: -28.640, longitude: 153.640,
    maxDepthMeters: 25,
    description: "A rocky islet just offshore from Byron Bay where the warm East Australian Current meets cooler southern waters — creating an overlap zone where tropical and temperate species coexist. Grey nurse sharks (critically endangered, aggregating here April–October), leopard sharks, eagle rays, manta rays, turtles, and enormous wobbegong sharks. The diversity resulting from the warm–cold water mixing is remarkable: tropical fish, temperate fish, nudibranchs, and sponges all on the same dive. The most biodiverse temperate dive site in Australia.",
    conditions: 'Current varies. Visibility 15–40 ft. 66–77°F (seasonal). Intermediate.',
    accessNotes: 'Boat from Byron Bay (~10 min). Several operators. Grey nurse shark season April–October. Leopard sharks November–May. Fly to Ballina/Byron (BNK) or Gold Coast (OOL).',
  },
  {
    name: 'Lord Howe Island',
    location: 'Lord Howe Island, New South Wales, Australia',
    region: 'Lord Howe Island',
    state: 'New South Wales',
    category: 'reef',
    latitude: -31.550, longitude: 159.080,
    maxDepthMeters: 30,
    description: "A UNESCO World Heritage island with the world's southernmost coral reef — a unique overlap zone where tropical corals and temperate species coexist. The lagoon reef supports over 500 fish species and 90 coral species at a latitude (31°S) where coral reefs shouldn't exist. Galápagos whaler sharks, doubleheader wrasse (an endemic species), Ballina angelfish, and enormous schools of kingfish. The underwater world mirrors the island's above-water uniqueness — Lord Howe's isolation has produced endemic species found nowhere else. Only 400 tourists are allowed on the island at any time.",
    conditions: 'Variable — calm in the lagoon. Visibility 20–60 ft. 64–77°F (seasonal). All skill levels in the lagoon.',
    accessNotes: 'Fly from Sydney or Brisbane to Lord Howe Island (LDH) — 2 hrs. Maximum 400 visitors at any time. One dive operator. Book accommodation and flights well ahead.',
  },
  {
    name: 'Port Lincoln — Great White Sharks',
    location: 'Port Lincoln, South Australia',
    region: 'South Australia',
    state: 'South Australia',
    category: 'reef',
    latitude: -34.730, longitude: 136.170,
    maxDepthMeters: 20,
    description: "Australia's great white shark capital — the Neptune Islands off Port Lincoln host one of the most reliable great white shark cage diving operations in the world. Large adult white sharks (3–5 m) approach the cage in clear, cold water. Surface viewing is also available for non-divers. Beyond great whites, the region offers extraordinary encounters with Australian sea lions at Hopkins Island (playful underwater interactions), leafy sea dragons (South Australia's marine emblem), and giant cuttlefish aggregations at Whyalla (May–August). South Australia is the temperate marine wildlife capital of the continent.",
    conditions: 'Cold 12–18°C. Visibility 20–60 ft. Atlantic swell. All skill levels for cage diving.',
    accessNotes: 'Fly or drive to Port Lincoln from Adelaide (~1 hr flight or 7 hr drive). Great white cage diving operators depart for Neptune Islands (day trips or overnight). Sea lion swims from Port Lincoln harbour.',
  },
];

// ── New Zealand ──────────────────────────────────────────────────────────────
const NEW_ZEALAND_SITES: LibrarySite[] = [
  {
    name: 'Poor Knights Islands',
    location: 'Poor Knights Islands Marine Reserve, Northland, New Zealand',
    region: 'Northland',
    state: 'Northland',
    category: 'reef',
    latitude: -35.475, longitude: 174.740,
    maxDepthMeters: 40,
    description: "Jacques Cousteau rated the Poor Knights among the top 10 dive sites in the world. A group of volcanic islands surrounded by the subtropical East Auckland Current, the Poor Knights support a remarkable mix of subtropical and temperate marine life. Enormous archways, tunnels, and sea caves pierce the islands — Rikoriko Cave is the world's largest sea cave by volume. Stingrays, kingfish, blue maomao, nudibranchs, subtropical species at their southern limit, and occasional orca. The underwater topography (arches large enough for boats) combined with the species mix is unique to New Zealand.",
    conditions: 'Some current. Visibility 30–100 ft. 60–72°F (seasonal). Intermediate on cave dives.',
    accessNotes: 'Boat from Tutukaka (~45 min). No landing on the islands permitted (nature reserve). Several operators in Tutukaka. Best January–May (warmest water). 3 hrs drive north of Auckland.',
  },
  {
    name: 'Milford Sound — Fiordland',
    location: 'Milford Sound, Fiordland, New Zealand',
    region: 'Fiordland',
    state: 'Southland',
    category: 'reef',
    latitude: -44.670, longitude: 167.930,
    maxDepthMeters: 40,
    description: "One of the most unusual dive environments on Earth — a glacial fiord where a permanent layer of tannin-stained freshwater sits on top of clear seawater, blocking light and creating deepwater conditions in shallow water. Black coral — normally found at 200+ m in the tropics — grows here at recreational diving depths (15–30 m). Milford Sound has the world's most accessible black coral forest. The fiord walls are covered in unique invertebrate communities: brachiopods, tubeworms, and red and black coral. Bottlenose dolphins and fur seals are regular companions. A genuinely otherworldly dive experience.",
    conditions: 'Cold 12–16°C. Dark (freshwater layer blocks light). Visibility varies — murky layer then clear seawater. Intermediate to advanced.',
    accessNotes: 'Descend Dive operates in Milford Sound from Te Anau/Milford. Drive from Queenstown (~4 hrs). Weather dependent — Fiordland is one of the wettest places on Earth. Best November–April.',
  },
];

// ── Papua New Guinea ─────────────────────────────────────────────────────────
const PAPUA_NEW_GUINEA_SITES: LibrarySite[] = [
  {
    name: 'Kimbe Bay',
    location: 'Kimbe, West New Britain, Papua New Guinea',
    region: 'West New Britain',
    state: 'West New Britain',
    category: 'reef',
    latitude: -5.400, longitude: 150.200,
    maxDepthMeters: 30,
    description: "Home to over 860 species of reef fish and 350 species of hard coral — Kimbe Bay sits within the Coral Triangle and is one of the most biodiverse marine environments on Earth. Underwater seamounts and reef pinnacles rise from deep water, attracting enormous schools of barracuda, trevally, and fusiliers. Manta rays visit cleaning stations, reef sharks patrol the walls, and the coral coverage is pristine. The bay's protected waters and the absence of mass tourism produce reef health that rivals Raja Ampat. An expedition-style destination for serious divers.",
    conditions: 'Mild current. Visibility 40–100 ft. 82–86°F. All skill levels on most sites.',
    accessNotes: 'Fly from Port Moresby to Hoskins (HKN), then drive to Kimbe. A few dive resorts. Liveaboards also operate. Remote — limited infrastructure.',
  },
  {
    name: 'Milne Bay — Blackwater & Muck Diving',
    location: 'Alotau, Milne Bay, Papua New Guinea',
    region: 'Milne Bay',
    state: 'Milne Bay',
    category: 'reef',
    latitude: -10.300, longitude: 150.450,
    maxDepthMeters: 30,
    description: "The birthplace of blackwater diving — night dives in open ocean where a downline with lights attracts bizarre deep-sea larvae, pelagic octopus, blanket octopus, paper nautilus, and creatures that defy description as they migrate from the deep. Milne Bay also offers world-class muck diving (rivaling Lembeh) and pristine coral reefs. WWII wreck sites from the Battle of Milne Bay add historical interest. The combination of blackwater, muck, reef, and wreck diving in one location is unmatched. A pilgrimage for underwater photographers.",
    conditions: 'Calm bay. Visibility 20–80 ft. 82–86°F. All skill levels for reef; blackwater requires comfort in open water at night.',
    accessNotes: 'Fly from Port Moresby to Alotau (GUR). Liveaboards and a few shore-based resorts. Remote — adventurous logistics.',
  },
];

// ── Combined export ──────────────────────────────────────────────────────────

export const OCEANIA_SITES: LibrarySite[] = [
  ...AUSTRALIA_SITES,
  ...NEW_ZEALAND_SITES,
  ...PAPUA_NEW_GUINEA_SITES,
];

export const OCEANIA_COUNTRY_MAP: { sites: LibrarySite[]; country: string }[] = [
  { sites: AUSTRALIA_SITES,          country: 'Australia'         },
  { sites: NEW_ZEALAND_SITES,        country: 'New Zealand'       },
  { sites: PAPUA_NEW_GUINEA_SITES,   country: 'Papua New Guinea'  },
];
