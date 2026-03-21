/**
 * Caribbean Dive Site Library
 *
 * Covers: Cayman Islands, Bahamas, Turks & Caicos, Jamaica, Cuba,
 * British Virgin Islands, US Virgin Islands, Bonaire, Curaçao,
 * Aruba, Dominican Republic, Puerto Rico, St. Lucia, Grenada,
 * Dominica, Trinidad & Tobago, Barbados, Antigua & Barbuda,
 * St. Kitts & Nevis, Saba, Martinique, Guadeloupe,
 * St. Vincent & the Grenadines.
 */

import { LibrarySite } from './usSites';

// ── Cayman Islands ───────────────────────────────────────────────────────────
const CAYMAN_ISLANDS_SITES: LibrarySite[] = [
  {
    name: 'Stingray City',
    location: 'North Sound, Grand Cayman, Cayman Islands',
    region: 'Grand Cayman',
    state: 'Grand Cayman',
    category: 'reef',
    latitude: 19.381, longitude: -81.301,
    maxDepthMeters: 5,
    description: "The most famous shallow dive/snorkel in the Caribbean — a sandbar where dozens of wild Southern stingrays have gathered for decades, drawn by the fish scraps of passing boats. The rays glide underfoot, drape themselves over divers, and feed from open hands. Crystal-clear 3 m water over white sand makes this one of the most photogenic marine encounters in the world. An essential Grand Cayman experience even for non-divers.",
    conditions: 'Calm, sheltered sandbar. Visibility 50–80 ft. 78–84°F. No current. All skill levels.',
    accessNotes: 'Boat from Seven Mile Beach or Rum Point (~15 min). Every dive operator on Grand Cayman runs this trip. Often combined with a reef dive.',
  },
  {
    name: 'Bloody Bay Wall',
    location: 'Little Cayman, Cayman Islands',
    region: 'Little Cayman',
    state: 'Little Cayman',
    category: 'reef',
    latitude: 19.700, longitude: -80.060,
    maxDepthMeters: 40,
    description: "One of the most spectacular vertical wall dives on Earth. The reef crest sits in just 6 m of water, then drops vertically into a 1,800 m abyss — the Cayman Trench. The wall is encrusted with enormous barrel sponges, deepwater sea fans, black coral, and vibrant tube sponges in every color. Eagle rays, turtles, reef sharks, and Nassau grouper patrol the wall. The sheer scale — standing on the edge of a reef and looking into infinite blue — is breathtaking. Consistently rated among the top 5 wall dives in the world.",
    conditions: 'Minimal current on the wall. Visibility 80–150 ft. 78–82°F. All skill levels (wall starts shallow).',
    accessNotes: 'Little Cayman has a small airstrip with flights from Grand Cayman. A handful of dive resorts. Bloody Bay Marine Park — no anchoring, mooring buoys only. Quiet, unhurried island.',
  },
  {
    name: 'USS Kittiwake',
    location: 'Seven Mile Beach, Grand Cayman, Cayman Islands',
    region: 'Grand Cayman',
    state: 'Grand Cayman',
    category: 'wreck',
    latitude: 19.364, longitude: -81.396,
    maxDepthMeters: 20,
    description: "A decommissioned US Navy submarine rescue vessel (76 m long) sunk in 2011 as an artificial reef. The wreck sits upright in 20 m of clear water just off Seven Mile Beach and is fully penetrable — divers can swim through engine rooms, berthing compartments, the bridge, and decompression chambers. Marine life has colonized every surface: sponges, corals, moray eels, and schooling fish. One of the best purpose-sunk wrecks in the Caribbean and an easy shore dive or short boat ride.",
    conditions: 'Generally calm. Visibility 60–100 ft. 78–82°F. Mild current occasionally. All skill levels (external); Advanced for penetration.',
    accessNotes: 'Short boat ride from Seven Mile Beach. Multiple operators run this daily. Also accessible as a shore dive from the public beach with a surface swim.',
  },
  {
    name: 'Cayman Brac Bluff Wall',
    location: 'Cayman Brac, Cayman Islands',
    region: 'Cayman Brac',
    state: 'Cayman Brac',
    category: 'reef',
    latitude: 19.720, longitude: -79.785,
    maxDepthMeters: 40,
    description: "The dramatic limestone bluff that defines Cayman Brac continues underwater as a sheer wall dropping into the deep Cayman Trench. Pristine hard coral, massive barrel sponges, and sea fans line the wall. Reef sharks, eagle rays, hawksbill turtles, and large grouper are common. The MV Captain Keith Tibbetts — a decommissioned Russian frigate — sits nearby as a bonus wreck dive. Far fewer divers than Grand Cayman, making Brac feel like a private reef.",
    conditions: 'Light current. Visibility 80–120 ft. 78–82°F. All skill levels on most sites.',
    accessNotes: 'Flights from Grand Cayman to Cayman Brac (CYB). A few small dive resorts. Quiet, rugged island. Great for divers who want uncrowded walls.',
  },
];

// ── Bahamas ──────────────────────────────────────────────────────────────────
const BAHAMAS_SITES: LibrarySite[] = [
  {
    name: 'Tiger Beach',
    location: 'West End, Grand Bahama, Bahamas',
    region: 'Grand Bahama',
    state: 'Grand Bahama',
    category: 'reef',
    latitude: 26.660, longitude: -79.020,
    maxDepthMeters: 12,
    description: "The most famous shark dive in the world — a flat sandy bottom in 12 m of crystal-clear water where large tiger sharks, lemon sharks, Caribbean reef sharks, and great hammerheads gather reliably. Divers kneel on the sand as 4-meter tiger sharks cruise within arm's reach. No cage. The visibility, the size of the sharks, and the reliability of encounters make this the gold standard of shark diving worldwide. A bucket-list experience for any diver.",
    conditions: 'Open ocean, mild current. Visibility 60–100 ft. 75–82°F. Advanced divers — big shark experience.',
    accessNotes: 'Liveaboard or day boat from West End, Grand Bahama. Several dedicated shark operators. Best October–January for tiger sharks; hammerheads peak January–March.',
  },
  {
    name: 'Dean\'s Blue Hole',
    location: 'Long Island, Bahamas',
    region: 'Long Island',
    state: 'Long Island',
    category: 'reef',
    latitude: 23.105, longitude: -75.024,
    maxDepthMeters: 40,
    description: "The deepest known blue hole in the world — a circular sinkhole plunging 202 m into the Earth, surrounded by white sand beach. The opening is only 25 m across at the surface but expands to a massive 100 m diameter below, creating an amphitheater of deep blue. Recreational divers explore the rim and the dramatic light effects; freedivers use it as a competition venue (multiple world records have been set here). The sensation of hovering over a seemingly bottomless shaft of blue is genuinely awe-inspiring.",
    conditions: 'Calm, sheltered. Visibility 80–150 ft. 75–82°F. Shore entry. All skill levels for the rim; technical for depth.',
    accessNotes: 'Fly to Deadman\'s Cay (LGI) on Long Island from Nassau. A small dive operator in Clarence Town. Beach entry directly into the blue hole. Very undeveloped — bring supplies.',
  },
  {
    name: 'Exuma Cays Land and Sea Park',
    location: 'Exuma Cays, Bahamas',
    region: 'Exuma Cays',
    state: 'Exuma',
    category: 'reef',
    latitude: 24.410, longitude: -76.550,
    maxDepthMeters: 25,
    description: "The world's first land-and-sea park (1958) and one of the most pristine marine environments in the Caribbean. Decades of no-take protection have produced reef fish populations 4–5x denser than surrounding areas, enormous Nassau grouper, healthy staghorn and elkhorn coral, and fearless marine life. Thunderball Grotto — the underwater cave system featured in the James Bond film — is the signature site. Nurse sharks, eagle rays, turtles, and stingrays are common. Crystalline Bahamian water over white sand.",
    conditions: 'Protected waters. Visibility 60–100 ft. 75–82°F. Light current. All skill levels.',
    accessNotes: 'Liveaboard or private boat from Nassau or Staniel Cay. The park has mooring buoys — no anchoring. No supplies in the park. Staniel Cay has a small airport and basic services.',
  },
  {
    name: 'Shark Wall — Nassau',
    location: 'Nassau, New Providence, Bahamas',
    region: 'New Providence',
    state: 'New Providence',
    category: 'reef',
    latitude: 25.020, longitude: -77.340,
    maxDepthMeters: 20,
    description: "Nassau's signature shark diving experience — a wall dive where Caribbean reef sharks gather in numbers for a structured feeding dive. Up to 20–30 reef sharks circling in clear blue water at the wall's edge, with divers seated in the sand watching the action. The wall itself drops into deep blue and is decorated with sea fans and sponges. Stuart Cove's operation pioneered this dive and it remains one of the most reliable multi-shark encounters in the Caribbean.",
    conditions: 'Mild current along the wall. Visibility 60–100 ft. 76–82°F. All skill levels with experienced operator.',
    accessNotes: 'Boat from Nassau\'s south shore. Stuart Cove\'s is the main operator. Often combined with reef or wreck dives. Half-day trip.',
  },
  {
    name: 'Bimini — Great Hammerhead Migration',
    location: 'Bimini, Bahamas',
    region: 'Bimini',
    state: 'Bimini',
    category: 'reef',
    latitude: 25.710, longitude: -79.270,
    maxDepthMeters: 15,
    description: "Every winter (December–March), great hammerhead sharks — the largest hammerhead species, reaching 6 m — migrate through Bimini in significant numbers. Divers kneel on a sandy bottom in clear, shallow water as these magnificent animals cruise past at close range. The combination of crystal-clear water, shallow depth, and predictable encounters with one of the ocean's most iconic species makes Bimini arguably the best place in the world to dive with great hammerheads.",
    conditions: 'Sandy bottom, mild current. Visibility 40–80 ft. 72–78°F in winter. Advanced divers recommended.',
    accessNotes: 'Short flight or fast ferry from Fort Lauderdale to Bimini. Several shark-focused dive operators. Great hammerheads December–March. Book well ahead for peak season.',
  },
];

// ── Turks & Caicos ───────────────────────────────────────────────────────────
const TURKS_CAICOS_SITES: LibrarySite[] = [
  {
    name: 'Northwest Wall',
    location: 'Providenciales, Turks & Caicos',
    region: 'Providenciales',
    state: 'Providenciales',
    category: 'reef',
    latitude: 21.810, longitude: -72.290,
    maxDepthMeters: 40,
    description: "A dramatic vertical wall starting in just 12 m and dropping over 2,000 m into the Turks Island Passage — one of the deepest ocean trenches in the Atlantic. The wall is decorated with enormous purple and orange elephant ear sponges, giant tube sponges, sea fans, and black coral. Dolphins, eagle rays, reef sharks, and occasional humpback whales (January–April) pass in the blue. The wall\'s proximity to shore (a 10-minute boat ride) and the extreme clarity of Turks & Caicos water make this an exceptional wall dive.",
    conditions: 'Mild to moderate current. Visibility 80–150 ft. 78–82°F. All skill levels (wall starts shallow).',
    accessNotes: 'Boat from Grace Bay, Providenciales (~10 min). Multiple operators. Often combined with reef or sand channel dives.',
  },
  {
    name: 'Grand Turk Wall',
    location: 'Grand Turk, Turks & Caicos',
    region: 'Grand Turk',
    state: 'Grand Turk',
    category: 'reef',
    latitude: 21.440, longitude: -71.130,
    maxDepthMeters: 40,
    description: "Grand Turk's wall begins just 300 m from the beach — one of the closest wall dives to shore anywhere in the world. The Columbus Passage, a 35 km-wide channel reaching 2,200 m depth, brings nutrient-rich water and large pelagic life close to shore. The wall itself is festooned with sponges, gorgonians, and healthy hard corals. Manta rays, spotted eagle rays, humpback whales (seasonal), nurse sharks, and large grouper are regularly encountered. Quieter and less developed than Providenciales.",
    conditions: 'Current in the Columbus Passage varies. Visibility 80–120 ft. 78–82°F. Intermediate to advanced.',
    accessNotes: 'Grand Turk is accessible by inter-island flight from Providenciales or direct from Miami. A handful of operators. Very quiet island. Cruise ship port brings day visitors but the diving is uncrowded.',
  },
];

// ── Jamaica ──────────────────────────────────────────────────────────────────
const JAMAICA_SITES: LibrarySite[] = [
  {
    name: 'Montego Bay Marine Park',
    location: 'Montego Bay, Jamaica',
    region: 'Montego Bay',
    state: 'St. James',
    category: 'reef',
    latitude: 18.480, longitude: -77.920,
    maxDepthMeters: 25,
    description: "Jamaica's flagship marine protected area, covering a long stretch of fringing reef along Montego Bay's coastline. The Widowmaker's Cave system is the signature dive — a swim-through cavern decorated with sponges and home to nurse sharks and lobster. Coral gardens at Airport Reef and The Point show good recovery. Barracuda, eagle rays, moray eels, and dense schools of blue chromis and sergeant majors populate the reef. Easy access from Jamaica's main tourist hub.",
    conditions: 'Generally calm. Visibility 40–80 ft. 79–84°F. Light current. All skill levels.',
    accessNotes: 'Boat from Montego Bay hotels or waterfront — short ride. Multiple dive operators. Marine park fees apply.',
  },
  {
    name: 'Negril Marine Park',
    location: 'Negril, Jamaica',
    region: 'Negril',
    state: 'Westmoreland',
    category: 'reef',
    latitude: 18.280, longitude: -78.350,
    maxDepthMeters: 25,
    description: "The reef system along Negril's famous Seven Mile Beach features a series of shallow reef terraces stepping down to a mini-wall at 15–25 m. The Throne Room — a large swimthrough amphitheater — and The Arches are signature sites. Healthy sea fans, sponges, and recovering hard coral. Hawksbill turtles, nurse sharks, trumpetfish, and occasional dolphins. The shallow reef areas are excellent for new divers and snorkelers. Sunset shore dives off the West End cliffs are a local specialty.",
    conditions: 'Calm, west-facing (sheltered). Visibility 40–80 ft. 79–84°F. All skill levels.',
    accessNotes: 'Boat or shore entry from Negril beach resorts. Several dive operators. West End cliff diving (snorkel/scuba from the rocks) for more adventurous divers.',
  },
];

// ── Cuba ─────────────────────────────────────────────────────────────────────
const CUBA_SITES: LibrarySite[] = [
  {
    name: 'Jardines de la Reina',
    location: 'Gardens of the Queen, Ciego de Ávila, Cuba',
    region: 'Southern Cuba',
    state: 'Ciego de Ávila',
    category: 'reef',
    latitude: 20.800, longitude: -79.000,
    maxDepthMeters: 30,
    description: "Cuba's crown jewel and one of the healthiest reef ecosystems remaining in the Caribbean — a 120 km archipelago of pristine mangrove cays and coral reefs that has been a marine protected area since 1996. Strict visitor limits (only one liveaboard operator) have preserved what many marine biologists consider the benchmark for a healthy Caribbean reef. Huge populations of Caribbean reef sharks (20–30 per dive), American crocodiles that swim with divers in the mangroves, enormous goliath grouper, hawksbill and green turtles, and hard coral coverage that Caribbean divers have largely forgotten existed elsewhere.",
    conditions: 'Protected waters inside the archipelago. Visibility 60–120 ft. 78–84°F. Light current. All skill levels.',
    accessNotes: 'Liveaboard from Júcaro port (Avalon fleet is the sole operator). Fly to Havana then domestic flight or drive to Júcaro. Book many months in advance. Cuban tourist visa required. Check travel regulations for your nationality.',
  },
  {
    name: 'Bay of Pigs (Playa Girón)',
    location: 'Playa Girón, Matanzas, Cuba',
    region: 'Southern Cuba',
    state: 'Matanzas',
    category: 'shore',
    latitude: 22.065, longitude: -81.039,
    maxDepthMeters: 30,
    description: "The infamous Bay of Pigs is one of Cuba's best shore diving destinations — a limestone coastline with cenote-like sinkholes and an accessible wall that drops from the shoreline into deep blue. The wall starts at just 3–5 m and plunges vertically. Sponge gardens, gorgonians, and healthy hard coral on the wall. Tarpon, barracuda, grouper, and tropical reef fish. The Cueva de los Peces (Fish Cave) — a 70 m deep cenote connected to the sea — is a must-dive. Historical significance adds a unique dimension.",
    conditions: 'Shore entry, calm. Visibility 50–100 ft. 78–82°F. Mild current on the wall. All skill levels.',
    accessNotes: 'Drive from Havana (~3 hrs) or Cienfuegos (~1.5 hrs). Basic dive operator at Playa Girón. Independent shore diving possible at several entry points along the coast. Very affordable diving.',
  },
];

// ── British Virgin Islands ───────────────────────────────────────────────────
const BVI_SITES: LibrarySite[] = [
  {
    name: 'RMS Rhone Wreck',
    location: 'Salt Island, British Virgin Islands',
    region: 'Salt Island',
    state: 'Salt Island',
    category: 'wreck',
    latitude: 18.390, longitude: -64.550,
    maxDepthMeters: 25,
    description: "The most famous wreck dive in the Caribbean — a Royal Mail Steam Packet Company ship that sank in a devastating hurricane on October 29, 1867. The 94 m iron-hulled vessel broke in two and lies in 6–25 m of clear water. The bow section is the deeper half, with the dramatic bowsprit and intact hull ribs draped in coral and sponges. The stern section sits in shallow water and is home to enormous schools of glassy sweepers, moray eels, and barracuda. Featured in the film The Deep. A protected marine park and the BVI's most iconic dive.",
    conditions: 'Generally calm (sheltered side of Salt Island). Visibility 40–80 ft. 78–82°F. Mild current. All skill levels (stern); Intermediate (bow).',
    accessNotes: 'Boat from Tortola or Virgin Gorda — most BVI operators run the Rhone. National Park mooring buoys. Two dives typically: bow and stern separately.',
  },
  {
    name: 'The Indians',
    location: 'Norman Island, British Virgin Islands',
    region: 'Norman Island',
    state: 'Norman Island',
    category: 'reef',
    latitude: 18.325, longitude: -64.625,
    maxDepthMeters: 15,
    description: "Four dramatic rock pinnacles jutting from the sea near Norman Island (the inspiration for Treasure Island). Underwater, the rocks form swim-throughs, arches, and canyons encrusted with colorful sponges, corals, and sea fans. Schools of blue tang, grunts, and chromis swirl around the pinnacles. Hawksbill turtles, nurse sharks, lobster, and octopus hide in the crevices. Excellent night diving. The combination of dramatic topography, marine life, and crystal-clear water in a compact area makes this one of the BVI's finest reef dives.",
    conditions: 'Protected, calm. Visibility 40–80 ft. 78–82°F. Light current. All skill levels.',
    accessNotes: 'Boat from Tortola (~30 min). Popular mooring spot for sailing charters. Also near Norman Island\'s famous "Caves" snorkel site.',
  },
];

// ── US Virgin Islands ────────────────────────────────────────────────────────
const USVI_SITES: LibrarySite[] = [
  {
    name: 'Buck Island Reef — St. Croix',
    location: 'Buck Island, St. Croix, US Virgin Islands',
    region: 'St. Croix',
    state: 'St. Croix',
    category: 'reef',
    latitude: 17.790, longitude: -64.620,
    maxDepthMeters: 15,
    description: "A National Monument protecting one of the finest elkhorn coral barrier reefs in the Caribbean. The underwater trail — marked with plaques — winds through towering elkhorn formations that create cathedral-like structures. Green and hawksbill turtles are abundant, along with parrotfish, angelfish, and trumpetfish. The elkhorn coral here has shown strong recovery compared to most Caribbean reefs. The combination of a marked trail, healthy elkhorn, and National Monument protection makes this an important ecological and recreational site.",
    conditions: 'Protected lagoon side is calm. Visibility 40–80 ft. 78–82°F. Light current. All skill levels.',
    accessNotes: 'Boat from Christiansted, St. Croix (~30 min). Several charter operators. National Monument — no anchoring, no collecting. Snorkeling and diving.',
  },
  {
    name: 'Cow & Calf Rocks — St. Thomas',
    location: 'St. Thomas, US Virgin Islands',
    region: 'St. Thomas',
    state: 'St. Thomas',
    category: 'reef',
    latitude: 18.310, longitude: -64.850,
    maxDepthMeters: 20,
    description: "Two submerged rock formations off St. Thomas that attract a remarkable density of marine life. Large schools of horse-eye jacks, barracuda, and crevalle jacks swirl around the rocks. Nurse sharks rest in overhangs, sea turtles graze the reef, and eagle rays cruise past. The rocks rise from a sandy bottom and the contrast between the barren sand and the life-covered pinnacles creates dramatic visibility. One of the most reliable sites in the USVI for encountering large schools of fish.",
    conditions: 'Some current (attracts the fish). Visibility 40–80 ft. 78–82°F. Intermediate skill level.',
    accessNotes: 'Boat from St. Thomas — most operators include this site. Short ride from Red Hook or Charlotte Amalie.',
  },
];

// ── Bonaire ──────────────────────────────────────────────────────────────────
const BONAIRE_SITES: LibrarySite[] = [
  {
    name: 'Something Special',
    location: 'Kralendijk, Bonaire',
    region: 'Bonaire West Coast',
    state: 'Bonaire',
    category: 'shore',
    latitude: 12.157, longitude: -68.278,
    maxDepthMeters: 20,
    description: "Bonaire's signature dive — a shore dive off a sandy entry point where seahorses, frogfish, octopus, and a remarkable density of macro life populate the reef slope. Bonaire's entire western coastline is a marine park, and Something Special exemplifies why Bonaire is consistently rated the #1 shore diving destination in the world. The reef is healthy, diverse, and teeming with life at every depth. A stake-and-stone-marked entry makes navigation easy. Night diving here reveals bioluminescent displays, octopus hunting, and basket stars unfurling.",
    conditions: 'Calm, sheltered western coast. Visibility 60–100 ft. 79–84°F. No current. All skill levels.',
    accessNotes: 'Drive-up shore diving — Bonaire\'s trademark. Yellow painted stones mark every dive site on the coastal road. Rent a pickup truck, load your gear, and dive any site anytime. No boat needed.',
  },
  {
    name: '1000 Steps',
    location: 'Northern Bonaire',
    region: 'Bonaire West Coast',
    state: 'Bonaire',
    category: 'shore',
    latitude: 12.220, longitude: -68.340,
    maxDepthMeters: 30,
    description: "Named for the limestone staircase carved into the cliff (it's actually about 70 steps), this is one of Bonaire's most dramatic shore entries — a descent down a cliff face to a pristine double reef system. The first reef terrace has dense staghorn and brain coral. A sand channel separates it from the second reef, which drops into deeper water with barrel sponges, sea fans, and black coral. Turtles, eagle rays, tarpon, and large grouper. The cliff-top view alone is worth the visit. One of the best-known shore dives in the world.",
    conditions: 'Calm. Visibility 60–100 ft. 79–84°F. No significant current. All skill levels.',
    accessNotes: 'Drive to the marked site on the northern coastal road. Gear up at the car and walk down the stairs. The climb back up with gear is the real challenge — hence the name.',
  },
  {
    name: 'Salt Pier',
    location: 'Southern Bonaire',
    region: 'Bonaire South',
    state: 'Bonaire',
    category: 'shore',
    latitude: 12.077, longitude: -68.246,
    maxDepthMeters: 15,
    description: "An active industrial salt-loading pier whose concrete pilings have become one of the most spectacular artificial reef ecosystems in the Caribbean. Every piling is encrusted from waterline to seabed with orange cup corals, purple sponges, and green algae. Dense schools of silversides swarm between the pilings creating shimmering curtains of light. Frogfish, seahorses, moray eels, and octopus abound. Night dives here are legendary — the pier lights attract plankton which attracts everything else. An absolute must-dive on Bonaire.",
    conditions: 'Calm. Visibility 40–80 ft. 79–84°F. Can only dive when no ship is docked. All skill levels.',
    accessNotes: 'Shore entry from the beach adjacent to the pier. Check if a ship is docked — diving is prohibited during loading operations. Usually diveable several days per week.',
  },
];

// ── Curaçao ──────────────────────────────────────────────────────────────────
const CURACAO_SITES: LibrarySite[] = [
  {
    name: 'Tugboat Beach',
    location: 'Caracasbaai, Curaçao',
    region: 'Curaçao South Coast',
    state: 'Curaçao',
    category: 'wreck',
    latitude: 12.074, longitude: -68.893,
    maxDepthMeters: 5,
    description: "A small tugboat sunk in just 5 m of water, completely encrusted with colorful sponges and corals — one of the most photogenic shallow wrecks in the Caribbean. The surrounding reef is equally vibrant, with seahorses, frogfish, juvenile fish nurseries, and colorful reef fish. The shallow depth and calm conditions make this perfect for new divers and snorkelers. The small beach adjacent is a local favorite. An excellent introduction to Curaçao's reef diving.",
    conditions: 'Calm, sheltered bay. Visibility 40–80 ft. 79–82°F. No current. All skill levels.',
    accessNotes: 'Shore entry from Tugboat Beach (small parking fee). Popular with snorkelers and divers alike. Very easy access.',
  },
  {
    name: 'Mushroom Forest',
    location: 'San Juan, Curaçao',
    region: 'Curaçao West Coast',
    state: 'Curaçao',
    category: 'reef',
    latitude: 12.270, longitude: -69.120,
    maxDepthMeters: 25,
    description: "Curaçao's most unique dive site — a field of enormous star coral heads that have grown into mushroom-shaped pillars on the reef slope. These formations, some over 3 m tall, create a surreal underwater forest. The spaces between the coral mushrooms harbor moray eels, lobster, cleaning stations, and dense schools of grunts and snappers. Sea turtles are frequently seen. The topography is unlike anything else in the Caribbean, making this a must-dive for underwater photographers.",
    conditions: 'Calm. Visibility 50–100 ft. 79–82°F. No significant current. All skill levels.',
    accessNotes: 'Shore entry or boat access from the west coast. Several operators include Mushroom Forest on their sites. Easy shore diving with good parking access.',
  },
];

// ── Aruba ────────────────────────────────────────────────────────────────────
const ARUBA_SITES: LibrarySite[] = [
  {
    name: 'SS Antilla Wreck',
    location: 'Malmok, Aruba',
    region: 'Northwest Aruba',
    state: 'Aruba',
    category: 'wreck',
    latitude: 12.594, longitude: -70.064,
    maxDepthMeters: 18,
    description: "The largest wreck in the Caribbean — a 122 m German cargo ship scuttled by her own crew in 1940 to avoid capture. The Antilla lies on her port side in 18 m of clear water and is extensively penetrable. The hull is encrusted with giant tube sponges, coral growth, and anemones. Green moray eels, lobster, and schools of fish inhabit every compartment. The sheer size of the wreck (a full dive just to swim from bow to stern) and the dramatic marine life encrustation make this one of the finest wreck dives in the entire Caribbean.",
    conditions: 'Calm, sheltered. Visibility 40–80 ft. 79–84°F. No significant current. All skill levels (outside); Intermediate for penetration.',
    accessNotes: 'Boat from Palm Beach hotels (~10 min) or shore swim from Malmok Beach. Multiple operators. Night dives available.',
  },
];

// ── Dominican Republic ───────────────────────────────────────────────────────
const DOMINICAN_REPUBLIC_SITES: LibrarySite[] = [
  {
    name: 'Silver Bank — Humpback Whale Sanctuary',
    location: 'Silver Bank, Dominican Republic (80 km offshore)',
    region: 'Silver Bank',
    state: 'Puerto Plata',
    category: 'reef',
    latitude: 20.700, longitude: -69.100,
    maxDepthMeters: 15,
    description: "Every winter (January–April), 3,000–5,000 North Atlantic humpback whales migrate to the shallow Silver Bank to mate and calve — creating the densest concentration of humpback whales on Earth. Under strict permit, snorkelers (not scuba) can enter the water for in-water encounters with mother-calf pairs, singing males, and mating groups. The whales are remarkably tolerant — mother-calf pairs will approach to within meters. This is widely considered the greatest whale encounter on the planet.",
    conditions: 'Open ocean, can be rough. Water depth 15–25 m over the bank. Visibility 60–100 ft. 76–80°F. Snorkel only (no scuba). All swim levels.',
    accessNotes: 'Liveaboard from Puerto Plata (only ~3 permitted operators). 7-day trips. January–April only. Book 12+ months in advance. Expensive but life-changing.',
  },
  {
    name: 'Bayahibe Reef & Wrecks',
    location: 'Bayahibe, La Romana, Dominican Republic',
    region: 'Bayahibe',
    state: 'La Altagracia',
    category: 'reef',
    latitude: 18.371, longitude: -68.831,
    maxDepthMeters: 30,
    description: "The dive hub of the Dominican Republic — a small fishing village on the southeast coast with excellent reef diving and several purpose-sunk wrecks. The St. George wreck (40 m cargo ship in 30 m) is the highlight, covered in sponges and home to nurse sharks and barracuda. Coral reefs along the coastline feature walls, swim-throughs, and healthy fish populations. Saona Island, a short boat ride away, offers pristine shallow reefs and starfish-strewn sandbars. Good value diving in the Caribbean.",
    conditions: 'Calm. Visibility 40–80 ft. 79–84°F. Light current on some sites. All skill levels.',
    accessNotes: 'Drive from Punta Cana (~1 hr) or La Romana (~30 min). Several dive operators in Bayahibe village. Day trips to Saona Island and Catalina Island.',
  },
];

// ── Puerto Rico ──────────────────────────────────────────────────────────────
const PUERTO_RICO_SITES: LibrarySite[] = [
  {
    name: 'Desecheo Island',
    location: 'Desecheo Island, Puerto Rico (20 km offshore)',
    region: 'West Coast',
    state: 'Rincón',
    category: 'reef',
    latitude: 18.385, longitude: -67.480,
    maxDepthMeters: 40,
    description: "A remote, uninhabited island 20 km off Puerto Rico's west coast with some of the healthiest reef in US waters. Deep walls, massive boulder coral formations, enormous barrel sponges, and dramatic swimthroughs. Blacktip reef sharks, large grouper, eagle rays, and hawksbill turtles. The isolation and current-swept waters produce marine life density rarely seen elsewhere in Puerto Rico. Visibility regularly exceeds 100 ft in the deep blue oceanic water.",
    conditions: 'Open ocean, can be choppy. Strong current on some sites. Visibility 60–120 ft. 79–84°F. Intermediate to advanced.',
    accessNotes: 'Boat from Rincón or Mayagüez (~45 min). A handful of operators make the crossing on calm days. Weather-dependent — not diveable every day.',
  },
  {
    name: 'La Parguera Wall',
    location: 'La Parguera, Lajas, Puerto Rico',
    region: 'Southwest Coast',
    state: 'Lajas',
    category: 'reef',
    latitude: 17.945, longitude: -67.050,
    maxDepthMeters: 30,
    description: "A dramatic wall dropping from a shallow reef terrace into deep blue — the most accessible wall dive in Puerto Rico. The wall face is decorated with deep sea fans, tube sponges, and black coral. Turtles, nurse sharks, and large pelagics patrol the wall edge. The surrounding area includes mangrove-fringed bays, one of which (La Parguera Bay) is one of only five bioluminescent bays in the world. Combining wall diving and bioluminescence makes La Parguera uniquely special.",
    conditions: 'Mild current. Visibility 40–80 ft. 79–84°F. All skill levels on the reef top; intermediate for the wall.',
    accessNotes: 'Boat from La Parguera village (~15 min). Several operators. Night kayaking in the bioluminescent bay is an excellent complement to the diving.',
  },
];

// ── St. Lucia ────────────────────────────────────────────────────────────────
const ST_LUCIA_SITES: LibrarySite[] = [
  {
    name: 'Anse Chastanet Reef',
    location: 'Soufrière, St. Lucia',
    region: 'Soufrière',
    state: 'Soufrière',
    category: 'reef',
    latitude: 13.865, longitude: -61.075,
    maxDepthMeters: 25,
    description: "A shore-accessible reef directly beneath the dramatic Piton peaks — one of the most scenic dive settings in the Caribbean. The reef drops from a shallow coral garden into a wall festooned with sea fans, sponges, and healthy hard corals. Seahorses, frogfish, moray eels, turtles, and dense reef fish populations. The Soufrière Marine Management Area protects this coastline. Night dives reveal octopus, basket stars, and bioluminescent plankton against the backdrop of the illuminated Pitons.",
    conditions: 'Calm, west-facing. Visibility 40–80 ft. 79–84°F. Light current. All skill levels.',
    accessNotes: 'Shore entry from Anse Chastanet Resort beach (non-guests pay a beach fee). Boat dives also available from Soufrière. Spectacular above-water scenery with the twin Pitons.',
  },
];

// ── Grenada ──────────────────────────────────────────────────────────────────
const GRENADA_SITES: LibrarySite[] = [
  {
    name: 'Bianca C Wreck',
    location: 'St. George\'s, Grenada',
    region: 'St. George\'s',
    state: 'St. George',
    category: 'wreck',
    latitude: 12.005, longitude: -61.745,
    maxDepthMeters: 40,
    description: "The largest accessible shipwreck in the Caribbean — a 180 m Italian luxury cruise liner that caught fire and sank in 1961 in the harbor of St. George's. The Bianca C lies in 30–50 m and the bow rises to within 30 m of the surface. The sheer scale of the wreck is staggering — swimming along the hull takes multiple dives. Encrusted with sponges, corals, and soft corals, the wreck attracts large schools of jacks, barracuda, and nurse sharks. Often called the 'Titanic of the Caribbean.'",
    conditions: 'Current can be strong. Visibility 30–60 ft. 79–84°F. Advanced divers (depth and current).',
    accessNotes: 'Boat from St. George\'s harbour (~10 min). Several operators. Deep dive — multiple visits recommended to see the full wreck.',
  },
  {
    name: 'Moliniere Underwater Sculpture Park',
    location: 'Moliniere Bay, Grenada',
    region: 'West Coast',
    state: 'St. George',
    category: 'reef',
    latitude: 12.070, longitude: -61.770,
    maxDepthMeters: 8,
    description: "The world's first underwater sculpture park — created by artist Jason deCaires Taylor in 2006. Concrete human figures standing on the seabed are slowly being colonized by marine life, creating a haunting fusion of art and nature. The sculptures include a ring of children holding hands, a man at a desk, and various life-sized figures. Coral, sponges, and algae grow over the figures while reef fish shelter among them. An extraordinary intersection of art, conservation, and diving that inspired similar installations worldwide.",
    conditions: 'Calm, shallow. Visibility 20–60 ft. 79–84°F. No current. All skill levels.',
    accessNotes: 'Boat or shore swim from Moliniere Bay (~5 min by boat from Grand Anse). Snorkelers and divers welcome. Marine Protected Area.',
  },
];

// ── Dominica ─────────────────────────────────────────────────────────────────
const DOMINICA_SITES: LibrarySite[] = [
  {
    name: 'Champagne Reef',
    location: 'Pointe Michel, Dominica',
    region: 'Roseau',
    state: 'St. Patrick',
    category: 'shore',
    latitude: 15.358, longitude: -61.378,
    maxDepthMeters: 15,
    description: "A unique volcanic reef where geothermally heated gas vents bubble continuously from the seabed, creating the appearance of swimming through champagne. The warm volcanic vents create a microhabitat that supports unusual marine life. Seahorses, frogfish, juvenile reef fish, and dense invertebrate communities thrive around the vents. The reef itself is a healthy mix of hard and soft corals. Shore entry makes this one of the most accessible and unusual dive sites in the Caribbean. Dominica is also the world's best destination for diving with resident sperm whales.",
    conditions: 'Calm, sheltered. Visibility 40–80 ft. 79–84°F. No significant current. All skill levels.',
    accessNotes: 'Shore entry from the beach at Pointe Michel, south of Roseau. Small entry fee. Easy access. Sperm whale encounters available November–March with specialized operators.',
  },
];

// ── Trinidad & Tobago ────────────────────────────────────────────────────────
const TRINIDAD_TOBAGO_SITES: LibrarySite[] = [
  {
    name: 'Speyside — Tobago',
    location: 'Speyside, Tobago',
    region: 'Speyside',
    state: 'Tobago',
    category: 'reef',
    latitude: 11.300, longitude: -60.520,
    maxDepthMeters: 30,
    description: "Tobago's premier dive destination and home to the world's largest brain coral — a massive specimen over 5 m wide and 3 m tall at Kelleston Drain. The nutrient-rich waters where the Caribbean meets the Atlantic produce extraordinary marine life density: giant manta rays (the main attraction, best May–January), eagle rays, nurse sharks, massive barrel sponges, and dense schools of Creole wrasse and jacks. Japanese Gardens, a maze of coral formations, is another signature site. Tobago offers some of the most underrated diving in the Caribbean.",
    conditions: 'Current can be strong (brings nutrients and mantas). Visibility 30–80 ft. 79–84°F. Intermediate to advanced.',
    accessNotes: 'Fly to Tobago (TAB) from Trinidad or direct from some Caribbean hubs. Speyside is a ~1.5 hr drive from the airport on the northeast coast. Several dive operators. Manta season roughly May–January.',
  },
];

// ── Saba ─────────────────────────────────────────────────────────────────────
const SABA_SITES: LibrarySite[] = [
  {
    name: 'Saba Marine Park — Pinnacles',
    location: 'Saba, Caribbean Netherlands',
    region: 'Saba',
    state: 'Saba',
    category: 'reef',
    latitude: 17.630, longitude: -63.250,
    maxDepthMeters: 40,
    description: "The tiny volcanic island of Saba (population ~2,000) is surrounded by one of the most pristine and well-managed marine parks in the Caribbean. The signature dives are the pinnacles — submerged volcanic seamounts rising from 40+ m to within 15 m of the surface, covered in sponges, black coral, and gorgonians. The Eye of the Needle and Third Encounter are legendary advanced pinnacle dives with nurse sharks, turtles, barracuda, and occasional pelagics. Strict mooring-only rules and tiny visitor numbers keep Saba diving pristine.",
    conditions: 'Current on pinnacles — intermediate to advanced. Visibility 60–120 ft. 78–82°F. Deeper sites are advanced.',
    accessNotes: 'Fly to Saba (SAB) from St. Maarten on tiny STOL aircraft (one of the world\'s shortest runways) or ferry from St. Maarten. Two dive operators on the island. Very limited accommodation. A serious diver\'s destination.',
  },
];

// ── St. Kitts & Nevis ────────────────────────────────────────────────────────
const ST_KITTS_NEVIS_SITES: LibrarySite[] = [
  {
    name: 'MV River Taw Wreck',
    location: 'Basseterre, St. Kitts',
    region: 'Basseterre',
    state: 'St. Kitts',
    category: 'wreck',
    latitude: 17.280, longitude: -62.730,
    maxDepthMeters: 15,
    description: "A 44 m freighter sunk as an artificial reef in 15 m of clear water — now one of the most photogenic wrecks in the Lesser Antilles. The wreck is fully intact, upright, and colonized by sponges, corals, and dense schools of fish. Nurse sharks, barracuda, and moray eels are resident. Adjacent reef sites along the Southeast Peninsula feature walls, gorgonian gardens, and healthy hard coral. The volcanic geology creates dramatic underwater landscapes with lava flows and black sand channels.",
    conditions: 'Calm. Visibility 40–80 ft. 79–84°F. Light current. All skill levels.',
    accessNotes: 'Boat from Basseterre (~15 min). A few dive operators. Uncrowded — St. Kitts is not a high-traffic dive destination.',
  },
];

// ── Barbados ─────────────────────────────────────────────────────────────────
const BARBADOS_SITES: LibrarySite[] = [
  {
    name: 'Carlisle Bay — Wrecks',
    location: 'Carlisle Bay, Bridgetown, Barbados',
    region: 'South Coast',
    state: 'Christ Church',
    category: 'wreck',
    latitude: 13.080, longitude: -59.620,
    maxDepthMeters: 20,
    description: "A sheltered bay containing six shipwrecks within a compact area — including the Stavronikita (a 111 m Greek freighter), Berwyn (a French tug), and Ce-Trek (a cement carrier). All lie in 6–20 m of calm, clear water and are heavily colonized by corals, sponges, and marine life. Sea turtles (both hawksbill and green) are exceptionally abundant — 10+ per dive is normal. The combination of multiple wrecks, easy conditions, and prolific turtle encounters makes Carlisle Bay one of the best wreck diving areas in the Caribbean for all skill levels.",
    conditions: 'Calm bay. Visibility 30–80 ft. 79–84°F. No significant current. All skill levels.',
    accessNotes: 'Boat from Bridgetown waterfront (~5 min). Multiple operators. Year-round diving. Easy shore access for some wrecks.',
  },
];

// ── Antigua & Barbuda ────────────────────────────────────────────────────────
const ANTIGUA_SITES: LibrarySite[] = [
  {
    name: 'Cades Reef',
    location: 'Cades Bay, Antigua',
    region: 'South Coast',
    state: 'St. Mary',
    category: 'reef',
    latitude: 17.040, longitude: -61.850,
    maxDepthMeters: 25,
    description: "Antigua's premier dive area — a 4 km barrier reef on the southwest coast with dramatic walls, overhangs, and sand channels. Healthy hard coral formations, large barrel sponges, and dense schools of blue tang, grunts, and chromis. Nurse sharks, eagle rays, hawksbill turtles, and barracuda are common. The reef's proximity to shore and generally calm conditions make it accessible year-round. The Andes wreck — a 19th-century merchant ship — adds a historical dimension. Antigua's 365 beaches and Nelson's Dockyard (UNESCO) complement the diving.",
    conditions: 'Calm. Visibility 40–80 ft. 79–84°F. Light current. All skill levels.',
    accessNotes: 'Boat from Jolly Harbour or English Harbour (~15 min). Several operators. Fly to Antigua (ANU).',
  },
];

// ── Bermuda ──────────────────────────────────────────────────────────────────
const BERMUDA_SITES: LibrarySite[] = [
  {
    name: 'Bermuda Wreck Trail',
    location: 'Bermuda (Atlantic Ocean)',
    region: 'Bermuda',
    state: 'Bermuda',
    category: 'wreck',
    latitude: 32.310, longitude: -64.780,
    maxDepthMeters: 30,
    description: "Bermuda has more shipwrecks per square mile than anywhere else on Earth — over 300 wrecks surround this Atlantic island, victims of its shallow reef platform and treacherous boilers. The most famous dives include the Constellation and Montana (adjacent wrecks that inspired Peter Benchley's The Deep), the Hermes (a 50 m freighter in 25 m), and the Mary Celestia (a Civil War blockade runner with intact paddlewheels). The wrecks span 400 years of maritime history. Bermuda's isolated mid-Atlantic position also brings warm Gulf Stream water, producing surprising coral growth and reef fish diversity at a latitude (32°N) where none should exist.",
    conditions: 'Atlantic swell possible. Visibility 40–100 ft. 64–82°F (seasonal). Mild current. All skill levels on shallow wrecks.',
    accessNotes: 'Fly to Bermuda (BDA) from US East Coast (~2 hrs). Multiple dive operators. Year-round diving but best May–October for warmth and calm seas.',
  },
];

// ── Martinique ─────────────────────────────────────────────────────────────
const MARTINIQUE_SITES: LibrarySite[] = [
  {
    name: 'Diamond Rock (Rocher du Diamant)',
    location: 'Le Diamant, Martinique',
    region: 'South Coast',
    state: 'Martinique',
    category: 'reef',
    latitude: 14.440, longitude: -61.040,
    maxDepthMeters: 30,
    description: "A volcanic pinnacle rising 175 m from the Caribbean Sea off Martinique's south coast — one of the most dramatic dive sites in the French Antilles. The submerged walls are covered in barrel sponges, black coral, gorgonians, and encrusting corals. Turtles, nurse sharks, eagle rays, and dense schools of Creole wrasse swirl around the rock. The Napoleonic history adds intrigue — the British fortified the rock as HMS Diamond Rock in 1804, turning it into a 'ship of war' that harassed French shipping for 18 months. Strong current brings nutrients and pelagics.",
    conditions: 'Current and surge on exposed sides. Visibility 40–80 ft. 79–84°F. Intermediate to advanced.',
    accessNotes: 'Boat from Le Diamant or Les Anses-d\'Arlet (~20 min). Several operators. Fly to Fort-de-France (FDF). French territory — EUR accepted.',
  },
];

// ── Guadeloupe ────────────────────────────────────────────────────────────
const GUADELOUPE_SITES: LibrarySite[] = [
  {
    name: 'Réserve Cousteau — Pigeon Islands',
    location: 'Bouillante, Basse-Terre, Guadeloupe',
    region: 'Basse-Terre',
    state: 'Guadeloupe',
    category: 'reef',
    latitude: 16.167, longitude: -61.790,
    maxDepthMeters: 20,
    description: "Named in honor of Jacques Cousteau, who declared it one of the world's finest dive areas — the Réserve Cousteau encompasses the waters around the Pigeon Islands off Guadeloupe's west coast. The volcanic reef supports exceptional coral diversity, massive barrel sponges, and prolific marine life including sea turtles, seahorses, octopus, moray eels, and dense schools of tropical fish. The sheltered western coast provides calm conditions year-round. A well-managed marine reserve where decades of protection have produced visibly healthier reef than surrounding areas. Among the best diving in the French Caribbean.",
    conditions: 'Calm, sheltered. Visibility 30–80 ft. 79–84°F. Light current. All skill levels.',
    accessNotes: 'Boat from Bouillante or Malendure beach (~5 min). Multiple operators. Fly to Pointe-à-Pitre (PTP). French territory. Best January–May.',
  },
];

// ── St. Vincent & the Grenadines ──────────────────────────────────────────
const ST_VINCENT_SITES: LibrarySite[] = [
  {
    name: 'Tobago Cays Marine Park',
    location: 'Tobago Cays, Grenadines, St. Vincent & the Grenadines',
    region: 'Grenadines',
    state: 'Grenadines',
    category: 'reef',
    latitude: 12.630, longitude: -61.360,
    maxDepthMeters: 20,
    description: "A cluster of five uninhabited islands enclosed by Horseshoe Reef — one of the most spectacular reef and snorkeling environments in the Caribbean. The shallow reef lagoon is home to enormous populations of green sea turtles that graze on seagrass beds and can be snorkeled with at arm's length. The outer reef walls offer excellent diving with healthy hard coral, barrel sponges, nurse sharks, eagle rays, and barracuda. The setting — palm-fringed cays, turquoise water, and protected reefs — is the postcard Caribbean at its most unspoiled. A popular anchorage for sailing yachts exploring the Grenadines.",
    conditions: 'Calm inside the reef. Visibility 40–80 ft. 79–84°F. Light current outside. All skill levels.',
    accessNotes: 'Boat from Union Island or chartered yacht. Fly to Union Island (UNI) via Barbados or St. Vincent. Day trips from nearby Grenadine islands. Marine park fee.',
  },
];

// ── Combined export ──────────────────────────────────────────────────────────

export const CARIBBEAN_SITES: LibrarySite[] = [
  ...CAYMAN_ISLANDS_SITES,
  ...BAHAMAS_SITES,
  ...TURKS_CAICOS_SITES,
  ...JAMAICA_SITES,
  ...CUBA_SITES,
  ...BVI_SITES,
  ...USVI_SITES,
  ...BONAIRE_SITES,
  ...CURACAO_SITES,
  ...ARUBA_SITES,
  ...DOMINICAN_REPUBLIC_SITES,
  ...PUERTO_RICO_SITES,
  ...ST_LUCIA_SITES,
  ...GRENADA_SITES,
  ...DOMINICA_SITES,
  ...TRINIDAD_TOBAGO_SITES,
  ...SABA_SITES,
  ...ST_KITTS_NEVIS_SITES,
  ...BARBADOS_SITES,
  ...ANTIGUA_SITES,
  ...BERMUDA_SITES,
  ...MARTINIQUE_SITES,
  ...GUADELOUPE_SITES,
  ...ST_VINCENT_SITES,
];

export const CARIBBEAN_COUNTRY_MAP: { sites: LibrarySite[]; country: string }[] = [
  { sites: CAYMAN_ISLANDS_SITES,       country: 'Cayman Islands'       },
  { sites: BAHAMAS_SITES,              country: 'Bahamas'              },
  { sites: TURKS_CAICOS_SITES,         country: 'Turks & Caicos'      },
  { sites: JAMAICA_SITES,              country: 'Jamaica'              },
  { sites: CUBA_SITES,                 country: 'Cuba'                 },
  { sites: BVI_SITES,                  country: 'British Virgin Islands' },
  { sites: USVI_SITES,                 country: 'US Virgin Islands'    },
  { sites: BONAIRE_SITES,              country: 'Bonaire'              },
  { sites: CURACAO_SITES,              country: 'Curaçao'              },
  { sites: ARUBA_SITES,                country: 'Aruba'                },
  { sites: DOMINICAN_REPUBLIC_SITES,   country: 'Dominican Republic'   },
  { sites: PUERTO_RICO_SITES,          country: 'Puerto Rico'          },
  { sites: ST_LUCIA_SITES,             country: 'St. Lucia'            },
  { sites: GRENADA_SITES,              country: 'Grenada'              },
  { sites: DOMINICA_SITES,             country: 'Dominica'             },
  { sites: TRINIDAD_TOBAGO_SITES,      country: 'Trinidad & Tobago'    },
  { sites: SABA_SITES,                 country: 'Saba'                 },
  { sites: ST_KITTS_NEVIS_SITES,       country: 'St. Kitts & Nevis'   },
  { sites: BARBADOS_SITES,             country: 'Barbados'             },
  { sites: ANTIGUA_SITES,              country: 'Antigua & Barbuda'    },
  { sites: BERMUDA_SITES,              country: 'Bermuda'              },
  { sites: MARTINIQUE_SITES,           country: 'Martinique'            },
  { sites: GUADELOUPE_SITES,           country: 'Guadeloupe'            },
  { sites: ST_VINCENT_SITES,           country: 'St. Vincent & the Grenadines' },
];
