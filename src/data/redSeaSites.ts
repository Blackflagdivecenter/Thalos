/**
 * Red Sea & Middle East Dive Site Library
 *
 * Covers: Egypt, Jordan, Saudi Arabia, Sudan, Djibouti, Oman,
 * Bahrain, UAE.
 */

import { LibrarySite } from './usSites';

// ── Egypt ────────────────────────────────────────────────────────────────────
const EGYPT_SITES: LibrarySite[] = [
  {
    name: 'Ras Mohammed National Park',
    location: 'Ras Mohammed, Sharm el-Sheikh, South Sinai, Egypt',
    region: 'Sinai Peninsula',
    state: 'South Sinai',
    category: 'reef',
    latitude: 27.730, longitude: 34.260,
    maxDepthMeters: 30,
    description: "Egypt's crown jewel and one of the top 5 reef diving destinations in the world. The tip of the Sinai Peninsula where the Gulf of Suez meets the Gulf of Aqaba creates upwellings that produce extraordinary reef growth and marine life. Shark Reef and Yolanda Reef are the signature dives: a vertical wall dropping into the abyss, patrolled by Napoleon wrasse, barracuda, and grey reef sharks, leading to the wreck of the Yolanda cargo ship (scattered bathroom fixtures across the reef). The hard coral coverage is among the most spectacular on Earth.",
    conditions: 'Current on exposed points. Visibility 60–130 ft. 72–82°F. All skill levels on most sites.',
    accessNotes: 'Day boat from Sharm el-Sheikh (~30 min) or liveaboard. Fly to Sharm el-Sheikh (SSH). National Park fee. Multiple operators.',
  },
  {
    name: 'SS Thistlegorm Wreck',
    location: 'Straits of Gubal, Red Sea, Egypt',
    region: 'Northern Red Sea',
    state: 'South Sinai',
    category: 'wreck',
    latitude: 27.813, longitude: 33.922,
    maxDepthMeters: 30,
    description: "The most famous wreck dive in the world — a 129 m British transport ship sunk by German bombers on October 6, 1941 while carrying war supplies to North Africa. The Thistlegorm's holds contain an extraordinary time capsule: BSA motorcycles, Bedford trucks, Bren gun carriers, rifles, ammunition, locomotive parts, Wellington boots, and aircraft wings, all perfectly preserved in the clear Red Sea water. Rediscovered by Cousteau in 1955. Despite heavy visitor traffic, the experience of swimming through holds full of WWII vehicles is unforgettable.",
    conditions: 'Current can be strong. Visibility 40–80 ft. 72–82°F. Intermediate divers.',
    accessNotes: 'Day boat from Sharm el-Sheikh or Hurghada (3–4 hrs), or liveaboard. Best visited by liveaboard to avoid the day-boat crowds. Night dives occasionally possible on liveaboards.',
  },
  {
    name: 'Elphinstone Reef',
    location: 'Marsa Alam, Red Sea, Egypt',
    region: 'Southern Red Sea',
    state: 'Red Sea Governorate',
    category: 'reef',
    latitude: 25.303, longitude: 34.862,
    maxDepthMeters: 40,
    description: "A cigar-shaped offshore reef rising from deep water — one of the best shark diving sites in the Red Sea. Oceanic whitetip sharks are the star attraction (increasingly rare worldwide but reliable here), along with grey reef sharks, hammerheads, and occasionally tiger sharks. The walls are draped in soft corals — the famous 'Napoleon's Hat' formation at the south plateau is iconic. Strong current sweeps nutrients past the reef, creating a magnet for pelagic life. A thrilling, occasionally challenging dive that rewards with extraordinary encounters.",
    conditions: 'Strong current and open water. Visibility 60–130 ft. 72–82°F. Intermediate to advanced.',
    accessNotes: 'Day boat from Marsa Alam (~45 min) or liveaboard. Fly to Marsa Alam (RMF) or Hurghada (HRG). Best October–December for oceanic whitetips.',
  },
  {
    name: 'Dahab Blue Hole',
    location: 'Dahab, South Sinai, Egypt',
    region: 'Sinai Peninsula',
    state: 'South Sinai',
    category: 'shore',
    latitude: 28.572, longitude: 34.540,
    maxDepthMeters: 40,
    description: "The most famous blue hole in the diving world — a 130 m deep submarine sinkhole in the reef flat, accessible by shore entry. Recreational divers enjoy the shallow rim and the 26 m deep saddle connecting the hole to the open sea (The Arch). The blue hole is also the world's most notorious deep diving site — attempts to freedive or scuba dive The Arch at 56 m have claimed many lives, earning it the grim title of 'most dangerous dive site in the world.' For recreational divers staying within limits, the combination of crystal-clear water, shore access, and the dramatic blue abyss is mesmerizing.",
    conditions: 'Shore entry, calm. Visibility 60–130 ft. 72–82°F. All skill levels on the rim and saddle. Do NOT attempt The Arch without technical training.',
    accessNotes: 'Drive from Dahab town (~15 min). Restaurants and facilities at the Blue Hole. Multiple operators. Easy shore entry. Dahab is a budget-friendly dive base.',
  },
  {
    name: 'Brothers Islands',
    location: 'Brothers Islands, Red Sea, Egypt (60 km offshore)',
    region: 'Offshore Red Sea',
    state: 'Red Sea Governorate',
    category: 'reef',
    latitude: 26.319, longitude: 34.847,
    maxDepthMeters: 40,
    description: "Twin islands in the middle of the Red Sea — two of the most spectacular dive sites in Egypt. Big Brother has a Victorian-era lighthouse and walls covered in soft corals and gorgonians dropping into abyssal depths. Two cargo ship wrecks (the Numidia and Aida) lie on the walls. Little Brother is a shark magnet — grey reef sharks, thresher sharks, hammerheads, and oceanic whitetips patrol the reef. The combination of pristine walls, wrecks, and big pelagic encounters in one location is unbeatable. Liveaboard access only.",
    conditions: 'Strong current, exposed. Visibility 60–130 ft. 72–82°F. Intermediate to advanced.',
    accessNotes: 'Liveaboard only from Hurghada or Marsa Alam (overnight crossing). 5–7 day Red Sea liveaboard itineraries. Weather dependent — rough seas can prevent diving.',
  },
  {
    name: 'Abu Dabbab — Dugong Bay',
    location: 'Abu Dabbab, Marsa Alam, Egypt',
    region: 'Southern Red Sea',
    state: 'Red Sea Governorate',
    category: 'shore',
    latitude: 25.343, longitude: 34.737,
    maxDepthMeters: 15,
    description: "One of the most reliable locations in the world to encounter wild dugongs — a resident individual has frequented Abu Dabbab's seagrass meadows for years. The bay also hosts green sea turtles in remarkable numbers, guitar sharks (endangered shovelnose rays), and a healthy reef fringe. The sandy seagrass habitat is a nursery for many species. Shore entry from a beautiful beach makes this one of the easiest big-animal encounters in diving. The combination of dugong, turtles, and guitar sharks in a single shallow shore dive is exceptional.",
    conditions: 'Calm bay, shore entry. Visibility 30–60 ft. 72–82°F. All skill levels.',
    accessNotes: 'Drive from Marsa Alam airport (~30 min). Beach resort with dive center on site. Entry fee for the beach. Dawn dives best for dugong.',
  },
];

// ── Jordan ───────────────────────────────────────────────────────────────────
const JORDAN_SITES: LibrarySite[] = [
  {
    name: 'Aqaba — Cedar Pride Wreck & South Coast',
    location: 'Aqaba, Jordan',
    region: 'Gulf of Aqaba',
    state: 'Aqaba',
    category: 'wreck',
    latitude: 29.435, longitude: 34.975,
    maxDepthMeters: 30,
    description: "Jordan's entire 27 km Red Sea coastline offers excellent diving, centered around Aqaba. The Cedar Pride wreck (a 74 m freighter sunk deliberately in 1985) is the showpiece — lying on her side at 25 m, encrusted with soft corals, and home to lionfish, moray eels, and schooling fish. The south coast features pristine coral gardens, a power station reef (warm water attracts unusual species), and a tank wreck. Jordan's reefs benefit from strict protection and relatively low diver traffic compared to Egyptian Red Sea. Warm, clear, easy diving with excellent infrastructure.",
    conditions: 'Calm. Visibility 40–100 ft. 70–82°F. Shore and boat entry. All skill levels.',
    accessNotes: 'Fly to Aqaba (AQJ) or drive from Amman (~4 hrs). Multiple dive centers. Combine with Petra and Wadi Rum. Year-round diving.',
  },
];

// ── Saudi Arabia ─────────────────────────────────────────────────────────────
const SAUDI_ARABIA_SITES: LibrarySite[] = [
  {
    name: 'Farasan Islands',
    location: 'Farasan Islands, Jazan, Saudi Arabia',
    region: 'Southern Red Sea Coast',
    state: 'Jazan',
    category: 'reef',
    latitude: 16.700, longitude: 41.750,
    maxDepthMeters: 30,
    description: "Saudi Arabia's most important marine area — a protected archipelago of over 80 coral islands in the southern Red Sea with pristine reef and minimal diving pressure. The Farasan Islands are home to dolphins, dugongs, hawksbill and green turtles, manta rays, and whale sharks (seasonal). The coral reef here is among the healthiest in the Red Sea, largely untouched by tourism. Saudi Arabia's recently opened tourism sector means these reefs are being discovered by international divers for the first time. An emerging world-class destination.",
    conditions: 'Calm. Visibility 40–100 ft. 79–86°F. Mild current. All skill levels.',
    accessNotes: 'Free ferry from Jazan (~90 min). Very limited dive infrastructure — bring your own or arrange through Jeddah/Riyadh operators. Saudi tourist visa (e-visa) now available for many nationalities. Developing rapidly.',
  },
  {
    name: 'Jeddah & Yanbu Reefs',
    location: 'Jeddah/Yanbu, Saudi Arabia',
    region: 'Central Red Sea Coast',
    state: 'Makkah',
    category: 'reef',
    latitude: 21.500, longitude: 38.950,
    maxDepthMeters: 30,
    description: "The central Saudi Red Sea coast offers fringing reefs, offshore reef systems, and wrecks that have been dived by a small local community for decades but are only now opening to international visitors. The Ann Ann wreck near Jeddah is a large cargo ship in 30 m covered in soft corals. Pristine offshore reefs show coral coverage and fish density rivaling the best Egyptian sites but with virtually no other divers. Whale sharks are seen seasonally. The combination of world-class Red Sea reef diving and the novelty of a newly accessible destination makes this exciting.",
    conditions: 'Calm. Visibility 40–100 ft. 75–86°F. All skill levels on most sites.',
    accessNotes: 'Fly to Jeddah (JED) or Yanbu (YNB). Growing number of dive operators. Saudi e-visa required. Liveaboards beginning to operate. Best October–May.',
  },
];

// ── Sudan ────────────────────────────────────────────────────────────────────
const SUDAN_SITES: LibrarySite[] = [
  {
    name: 'Sha\'ab Rumi — Cousteau\'s Conshelf II',
    location: 'Sha\'ab Rumi, Sudanese Red Sea',
    region: 'Northern Sudanese Red Sea',
    state: 'Red Sea State',
    category: 'reef',
    latitude: 20.830, longitude: 37.420,
    maxDepthMeters: 30,
    description: "The site of Jacques Cousteau's legendary 1963 underwater habitat experiment, Conshelf II — where aquanauts lived on the seafloor for a month. The remains of the habitat (garage, shark cage) are still on the reef. But the diving here transcends history: the South Plateau is one of the greatest shark aggregation sites in the world — dozens of grey reef sharks, scalloped hammerheads, silky sharks, and oceanic whitetips in astonishing numbers. The reef wall is covered in soft corals of extraordinary beauty. Sudan's remoteness means these reefs see fewer divers in a year than Egypt's see in a day.",
    conditions: 'Current on exposed plateaus. Visibility 60–130 ft. 77–86°F. Intermediate to advanced.',
    accessNotes: 'Liveaboard from Port Sudan. Fly to Port Sudan (PZU) via Khartoum. Sudanese visa required. Limited liveaboard operators (M/Y Andromeda, etc.). Check travel advisories.',
  },
  {
    name: 'Sanganeb Atoll',
    location: 'Sanganeb Marine National Park, Sudanese Red Sea',
    region: 'Northern Sudanese Red Sea',
    state: 'Red Sea State',
    category: 'reef',
    latitude: 19.730, longitude: 37.430,
    maxDepthMeters: 40,
    description: "A UNESCO World Heritage site — the only atoll in the Red Sea, rising from abyssal depths 25 km offshore. The walls drop vertically from a shallow reef flat into infinite blue. Hammerhead sharks school on the north plateau, grey reef sharks and barracuda patrol the walls, and the coral growth (both hard and soft) is pristine. The lighthouse on the reef has been standing since 1965. Sanganeb represents what Red Sea diving looked like before mass tourism — an untouched, wild reef of staggering beauty.",
    conditions: 'Current on the plateaus. Visibility 80–150 ft. 77–86°F. Intermediate to advanced.',
    accessNotes: 'Liveaboard from Port Sudan. Same logistics as Sha\'ab Rumi — typically on the same itinerary.',
  },
];

// ── Djibouti ─────────────────────────────────────────────────────────────────
const DJIBOUTI_SITES: LibrarySite[] = [
  {
    name: 'Whale Shark Season — Gulf of Tadjoura',
    location: 'Gulf of Tadjoura, Djibouti',
    region: 'Gulf of Tadjoura',
    state: 'Djibouti',
    category: 'reef',
    latitude: 11.600, longitude: 43.150,
    maxDepthMeters: 15,
    description: "Every winter (November–February), juvenile whale sharks aggregate in the warm, plankton-rich waters of the Gulf of Tadjoura in one of the most reliable and accessible whale shark encounters in the world. Dozens of whale sharks — mostly juveniles 3–6 m long — feed at the surface, allowing snorkelers and divers to swim alongside them repeatedly. The experience is intimate and uncrowded — Djibouti receives a fraction of the visitors of better-known whale shark sites. The surrounding reefs are healthy and largely unexplored. One of the great emerging wildlife destinations.",
    conditions: 'Calm gulf. Visibility 20–60 ft. 79–86°F. Snorkel and scuba. All skill levels.',
    accessNotes: 'Fly to Djibouti-Ambouli (JIB). Operators run whale shark trips from Djibouti City. November–February for whale sharks. Very hot climate — diving provides relief. French and Somali spoken.',
  },
];

// ── Oman ─────────────────────────────────────────────────────────────────────
const OMAN_SITES: LibrarySite[] = [
  {
    name: 'Daymaniyat Islands',
    location: 'Daymaniyat Islands Nature Reserve, Oman',
    region: 'Gulf of Oman',
    state: 'Al Batinah',
    category: 'reef',
    latitude: 23.850, longitude: 57.800,
    maxDepthMeters: 25,
    description: "A chain of nine protected islands off the coast of Muscat — Oman's best diving destination. The islands sit at the confluence of the Gulf of Oman and the Arabian Sea, creating a mixing zone where tropical and temperate species overlap. Green and hawksbill turtles are abundant (the islands are a major nesting site). Whale sharks are seasonal visitors. The coral reefs are healthy and diverse, with a mix of Arabian Gulf and Indian Ocean species. Leopard sharks, eagle rays, and large schools of kingfish and trevally. An accessible and uncrowded Middle Eastern dive destination.",
    conditions: 'Calm in season. Visibility 20–60 ft. 72–86°F. Some current. All skill levels.',
    accessNotes: 'Boat from Al Mouj Marina, Muscat (~45 min). Several operators. Marine reserve — regulated access. Best October–May (cooler months). Fly to Muscat (MCT).',
  },
  {
    name: 'Musandam Peninsula — Fjords',
    location: 'Musandam, Oman',
    region: 'Musandam',
    state: 'Musandam',
    category: 'reef',
    latitude: 26.200, longitude: 56.300,
    maxDepthMeters: 25,
    description: "The 'Norway of Arabia' — dramatic limestone fjords (known as khors) plunging into the Strait of Hormuz. The underwater landscape mirrors the above-water scenery: steep walls, overhangs, and boulders populated by reef sharks, turtles, dolphins (enormous pods frequent the fjords), whale sharks (seasonal), and dense tropical reef fish. The mixing of cold upwelling Strait of Hormuz water with warm Arabian Gulf water produces high nutrient levels and excellent marine life. The remote, wild landscape and the absence of other divers make Musandam genuinely special.",
    conditions: 'Variable — can be cold with upwelling. Visibility 15–60 ft. 68–86°F. Some current. Intermediate.',
    accessNotes: 'Drive from Dubai (~2 hrs) across the border into Oman\'s Musandam exclave, or boat from Khasab. Several operators in Khasab and Dibba. Oman visa required (available at border for many nationalities).',
  },
];

// ── Bahrain ────────────────────────────────────────────────────────────────
const BAHRAIN_SITES: LibrarySite[] = [
  {
    name: 'Bahrain Pearl Diving Heritage Trail',
    location: 'Bahrain, Persian Gulf',
    region: 'Persian Gulf',
    state: 'Bahrain',
    category: 'reef',
    latitude: 26.030, longitude: 50.550,
    maxDepthMeters: 20,
    description: "Bahrain's UNESCO World Heritage pearl diving heritage extends underwater — the traditional pearl beds that made Bahrain the pearl capital of the ancient world for 4,000 years are still diveable. Shallow reef patches, coral gardens, and sandy substrates host Arabian Gulf species: hawksbill turtles, sea snakes, dugongs (one of the Gulf's last populations), rays, and grouper. The warm, shallow Gulf water supports a unique mix of Arabian and Indo-Pacific species adapted to extreme temperatures. Several artificial reef sites and wrecks have been sunk to expand dive opportunities. A culturally rich and underappreciated dive destination.",
    conditions: 'Calm. Visibility 15–40 ft. 68–90°F (extreme seasonal range). Some current. All skill levels.',
    accessNotes: 'Dive operators in Manama. Fly to Bahrain (BAH). Year-round diving. Summer water temps can exceed 35°C. Best October–May.',
  },
];

// ── UAE ────────────────────────────────────────────────────────────────────
const UAE_SITES: LibrarySite[] = [
  {
    name: 'Fujairah — East Coast Wrecks & Reefs',
    location: 'Fujairah, UAE (Gulf of Oman)',
    region: 'Gulf of Oman',
    state: 'Fujairah',
    category: 'wreck',
    latitude: 25.130, longitude: 56.340,
    maxDepthMeters: 30,
    description: "The UAE's premier dive destination — Fujairah sits on the Gulf of Oman coast (not the Persian Gulf), giving it access to much richer marine life. An extensive artificial reef program has placed dozens of wrecks, vehicles, and structures on the seabed, creating habitats that attract impressive marine life: whale sharks (seasonal), blacktip reef sharks, turtles, large grouper, barracuda, and dense schools of tropical fish. The MV Dibba wreck and the car graveyard are popular dives. Natural reef patches with healthy hard coral complement the artificial sites. The most accessible world-class diving in the Arabian Peninsula.",
    conditions: 'Generally calm. Visibility 15–60 ft. 72–86°F. Mild current. All skill levels.',
    accessNotes: 'Drive from Dubai (~1.5 hrs) or fly to Fujairah (FJR). Multiple dive operators. Year-round diving. Weekend destination for Dubai-based divers.',
  },
];

// ── Combined export ──────────────────────────────────────────────────────────

export const RED_SEA_SITES: LibrarySite[] = [
  ...EGYPT_SITES,
  ...JORDAN_SITES,
  ...SAUDI_ARABIA_SITES,
  ...SUDAN_SITES,
  ...DJIBOUTI_SITES,
  ...OMAN_SITES,
  ...BAHRAIN_SITES,
  ...UAE_SITES,
];

export const RED_SEA_COUNTRY_MAP: { sites: LibrarySite[]; country: string }[] = [
  { sites: EGYPT_SITES,         country: 'Egypt'         },
  { sites: JORDAN_SITES,        country: 'Jordan'        },
  { sites: SAUDI_ARABIA_SITES,  country: 'Saudi Arabia'  },
  { sites: SUDAN_SITES,         country: 'Sudan'         },
  { sites: DJIBOUTI_SITES,      country: 'Djibouti'      },
  { sites: OMAN_SITES,          country: 'Oman'          },
  { sites: BAHRAIN_SITES,       country: 'Bahrain'       },
  { sites: UAE_SITES,            country: 'UAE'           },
];
