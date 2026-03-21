#!/usr/bin/env python3
"""
Extract NAUI course pages using TOC page numbers.
"""

import pdfplumber
import sys

PDF_PATH = "/Users/johnyoungblood/Library/Mobile Documents/com~apple~CloudDocs/NAUI Stuff/2026_NAUI_StandardsandPolicyManual.pdf"

# Course page ranges from TOC
courses = [
    ("Policies Applying to All Courses", 50, 57),
    ("Tandem Scuba Diver", 59, 61),
    ("Introduction to Scuba", 62, 65),
    ("Scuba Diver (Supervised)", 66, 70),
    ("Supplied Air Snorkeling", 72, 72),
    ("Recreational Hookah Diver", 73, 80),
    ("Open Water Scuba Diver", 81, 89),
    ("Adaptive Scuba Diver", 90, 97),
    ("Experienced Scuba Diver", 98, 103),
    ("Refresher Scuba", 105, 109),
    ("Enriched Air Nitrox (EANx) Diver", 110, 113),
    ("Advanced Open Water Scuba Diver", 114, 117),
    ("Rescue Scuba Diver", 118, 122),
    ("Master Scuba Diver", 123, 126),
    ("Drysuit Diver", 127, 128),
    ("Full Face Mask Diver", 129, 132),
    ("Recreational DPV Diver", 133, 135),
    ("Sidemount Diver", 136, 139),
    ("Semi-Closed Rebreather Diver", 140, 143),
    ("Closed Circuit Rebreather Diver", 144, 147),
    ("Altitude Diver", 150, 152),
    ("Citizen Science Diver", 153, 156),
    ("Deep Diver", 157, 158),
    ("Night & Limited-Visibility Diver", 159, 160),
    ("Recreational Ice Diver", 161, 164),
    ("Search and Recovery Diver", 165, 166),
    ("Training Assistant", 167, 169),
    ("Underwater Archaeology", 170, 171),
    ("Underwater Digital Imaging Diver", 172, 174),
    ("Underwater Hunter and Collector", 175, 176),
    ("Underwater Naturalist Diver", 177, 179),
    ("Wreck Diver (External Survey)", 180, 181),
    ("Instructor Specified Specialty", 182, 183),
    ("Additional Policies - Leadership Courses", 185, 193),
    ("Assistant Instructor", 194, 197),
    ("Divemaster", 198, 204),
    ("Divemaster Crossover", 205, 211),
    ("Instructor", 212, 218),
    ("Instructor Crossover", 219, 224),
    ("Instructor Trainer", 225, 226),
    ("Course Director", 227, 228),
    ("Additional Policies - Technical Courses", 230, 234),
    ("Introduction to Technical Diving", 235, 238),
    ("Technical Decompression Diver", 239, 242),
    ("Helitrox Diver", 243, 246),
    ("Trimix I Diver", 247, 250),
    ("Trimix II Diver", 251, 254),
    ("Technical Overhead DPV Diver", 255, 258),
    ("Cavern Diver", 260, 264),
    ("Cave I Diver", 265, 269),
    ("Cave II Diver", 270, 274),
    ("Mine I Diver", 275, 279),
    ("Mine II Diver", 280, 284),
    ("Mine III Diver", 285, 289),
    ("Wreck Penetration Diver", 290, 293),
    ("Technical Support Leader", 295, 298),
    ("Cave Guide", 299, 302),
    ("Technical Instructor", 303, 305),
    ("Technical Instructor Examiner", 306, 307),
    ("Additional Policies - Public Safety", 309, 310),
    ("Public Safety Diver", 311, 316),
    ("Public Safety Diver Instructor", 318, 320),
    ("Public Safety Diver Instructor Examiner", 321, 322),
    ("Additional Policies - Apnea Courses", 324, 325),
    ("Skin Diver (Snorkeling)", 326, 329),
    ("Introduction to Mermaiding", 330, 331),
    ("Mermaiding I", 332, 334),
    ("Mermaiding II", 335, 338),
    ("Introduction to Freediving", 339, 339),
    ("Safe Buddy", 340, 340),
    ("Freediver", 341, 344),
    ("Intermediate Freediver", 345, 348),
    ("Advanced Freediver", 349, 350),
    ("Apnea Hunting and Collecting", 351, 352),
    ("Breath Hold Survival", 353, 354),
    ("Skin Diving Instructor", 356, 360),
    ("Freediver Supervisor", 361, 365),
    ("Freediver Instructor", 366, 369),
    ("Freediver Instructor Examiner", 370, 371),
    ("Additional Policies - First Aid", 373, 375),
    ("Basic Life Support CPR & First Aid", 376, 379),
    ("Emergency Oxygen for Scuba Diving", 380, 382),
    ("Diving First Aid", 383, 387),
    ("NAUI First Aid Instructor", 389, 392),
    ("NAUI First Aid Instructor Trainer", 393, 396),
    ("International Diver Recognition", 398, 399),
    ("Young Aquatic Explorers", 400, 403),
    ("Breathing Gas Mixer Blender", 405, 407),
]

with pdfplumber.open(PDF_PATH) as pdf:
    total_pages = len(pdf.pages)
    print(f"Total PDF pages: {total_pages}", file=sys.stderr)

    for course_name, start_pg, end_pg in courses:
        print(f"\n{'='*70}")
        print(f"COURSE: {course_name} (pages {start_pg}-{end_pg})")
        print('='*70)

        for pg_num in range(start_pg, min(end_pg + 1, total_pages + 1)):
            page_idx = pg_num - 1  # 0-indexed
            if page_idx < total_pages:
                page = pdf.pages[page_idx]
                text = page.extract_text()
                if text:
                    print(f"\n--- Page {pg_num} ---")
                    print(text)
