#!/usr/bin/env python3
"""
Targeted extraction of ONLY the Academics (hours), Minimum Required Hours, and Minimum Required Dives
for every NAUI course.
"""

import pdfplumber
import re

PDF_PATH = "/Users/johnyoungblood/Library/Mobile Documents/com~apple~CloudDocs/NAUI Stuff/2026_NAUI_StandardsandPolicyManual.pdf"

courses = [
    ("Tandem Scuba Diver", 59, 63),
    ("Introduction to Scuba (ISO 11121)", 62, 67),
    ("Scuba Diver (ISO 24801-1)", 66, 72),
    ("Supplied Air Snorkeling", 72, 76),
    ("Recreational Hookah Diver", 73, 82),
    ("Open Water Scuba Diver (ISO 24801-2)", 81, 92),
    ("Adaptive Scuba Diver", 90, 100),
    ("Experienced Scuba Diver", 96, 106),
    ("Refresher Scuba", 104, 112),
    ("Enriched Air Nitrox Diver (EANx)", 110, 116),
    ("Advanced Open Water Scuba Diver", 114, 120),
    ("Rescue Scuba Diver", 118, 125),
    ("Master Scuba Diver", 123, 130),
    ("Drysuit Diver", 126, 132),
    ("Full Face Mask Diver", 128, 135),
    ("Recreational DPV Diver", 132, 138),
    ("Sidemount Diver", 135, 142),
    ("Semi-Closed Rebreather (SCR) Diver", 139, 146),
    ("Closed Circuit Rebreather (CCR) Diver", 143, 150),
    ("Altitude Diver", 149, 155),
    ("Citizen Science Diver", 152, 159),
    ("Deep Diver", 156, 162),
    ("Night & Limited-Visibility Diver", 158, 164),
    ("Recreational Ice Diver", 160, 167),
    ("Search and Recovery Diver", 164, 169),
    ("Training Assistant", 167, 173),
    ("Underwater Archaeology", 169, 174),
    ("Underwater Digital Imaging Diver", 171, 177),
    ("Underwater Hunter and Collector", 174, 179),
    ("Underwater Naturalist Diver", 176, 182),
    ("Wreck Diver (External Survey)", 179, 185),
    ("Instructor Specified Specialty", 182, 187),
    ("Additional Policies - Leadership", 185, 196),
    ("Assistant Instructor (ISO 24802-1)", 192, 200),
    ("Divemaster (ISO 24801-3)", 197, 208),
    ("Divemaster Crossover Course (DMC)", 204, 215),
    ("Instructor (ISO 24802-2)", 211, 222),
    ("Instructor Crossover Course (ICC)", 218, 227),
    ("Instructor Trainer", 224, 229),
    ("Course Director", 226, 232),
    ("Additional Policies - Technical", 229, 237),
    ("Introduction to Technical Diving", 234, 241),
    ("Technical Decompression Diver", 238, 245),
    ("Helitrox Diver", 242, 249),
    ("Trimix I Diver", 246, 254),
    ("Trimix II Diver", 250, 257),
    ("Technical Overhead DPV Diver", 254, 261),
    ("Cavern Diver", 259, 267),
    ("Cave I Diver", 264, 272),
    ("Cave II Diver", 269, 277),
    ("Mine I Diver", 274, 283),
    ("Mine II Diver", 279, 287),
    ("Mine III Diver", 284, 293),
    ("Wreck Penetration Diver", 289, 296),
    ("Technical Support Leader", 294, 301),
    ("Cave Guide", 298, 305),
    ("Technical Instructor", 302, 309),
    ("Technical Instructor Examiner", 305, 311),
    ("Additional Policies - Public Safety", 308, 315),
    ("Public Safety Diver", 310, 320),
    ("Public Safety Diver Instructor", 317, 324),
    ("Public Safety Diver Instructor Examiner", 320, 326),
    ("Additional Policies - Apnea", 323, 329),
    ("Skin Diver / Snorkeling (ISO 13289)", 325, 333),
    ("Introduction to Mermaiding", 329, 334),
    ("Mermaiding I", 331, 337),
    ("Mermaiding II", 334, 341),
    ("Introduction to Freediving", 338, 343),
    ("Safe Buddy", 339, 343),
    ("Freediver", 340, 347),
    ("Intermediate Freediver", 344, 351),
    ("Advanced Freediver", 348, 354),
    ("Apnea Hunting and Collecting", 350, 357),
    ("Breath Hold Survival", 352, 358),
    ("Skin Diving Instructor (ISO 13970)", 355, 364),
    ("Freediver Supervisor", 360, 368),
    ("Freediver Instructor", 365, 373),
    ("Freediver Instructor Examiner", 369, 375),
    ("Additional Policies - First Aid", 372, 378),
    ("Basic Life Support CPR & First Aid", 375, 383),
    ("Emergency Oxygen for Scuba Diving", 379, 385),
    ("Diving First Aid (DFA)", 382, 391),
    ("NAUI First Aid Instructor", 388, 396),
    ("NAUI First Aid Instructor Trainer", 392, 400),
    ("International Diver Recognition", 397, 403),
    ("Young Aquatic Explorers", 399, 406),
    ("Breathing Gas Mixer Blender", 404, 410),
]

def find_key_sections(text):
    """Find and extract just the key numbers from the course text."""
    lines = text.split('\n')

    # Find relevant line ranges
    relevant_lines = []
    capture = False
    capture_count = 0

    for i, line in enumerate(lines):
        ls = line.strip().lower()

        # Start capturing near POLICIES or Practical Application
        if ('academic' in ls and 'hour' in ls) or \
           'minimum required' in ls or \
           'practical application' in ls or \
           'min. required' in ls or \
           ('confined water' in ls and ('dive' in ls or 'session' in ls)) or \
           ('open water' in ls and 'dive' in ls and any(c.isdigit() for c in line)):
            capture = True
            capture_count = 0

        if capture:
            relevant_lines.append(line)
            capture_count += 1
            if capture_count > 15:
                capture = False

        # Always include lines with key numbers
        if any(phrase in ls for phrase in [
            'minimum number',
            'number of open water',
            'number of confined',
            'number of dives',
            'number of sessions',
            'number of water',
            'training dives',
            'open water dives',
            'confined water dives',
            'pool dives',
            'required dives',
            'estimated hours',
            'water hours',
            'academic hours',
            'total dives',
            'total of',
        ]):
            if line not in relevant_lines:
                relevant_lines.append(line)

    return '\n'.join(relevant_lines)


with pdfplumber.open(PDF_PATH) as pdf:
    total_pages = len(pdf.pages)

    for course_name, start_pg, end_pg in courses:
        # Gather all text
        all_text_parts = []
        for pg_num in range(start_pg, min(end_pg + 1, total_pages + 1)):
            page_idx = pg_num - 1
            if page_idx < total_pages:
                page = pdf.pages[page_idx]
                text = page.extract_text()
                if text:
                    all_text_parts.append(f"[p{pg_num}] {text}")

        full_text = '\n'.join(all_text_parts)

        # Look for the POLICIES block specifically
        pol_start = -1
        for marker in ['POLICIES\n', 'POLICIES.', 'POLICIES\r']:
            idx = full_text.find(marker)
            if idx >= 0:
                pol_start = idx
                break

        if pol_start >= 0:
            section = full_text[pol_start:pol_start + 4000]
        else:
            section = full_text

        # Extract key lines
        key_text = find_key_sections(section)

        print(f"\n{'='*65}")
        print(f"COURSE: {course_name}")
        print('='*65)
        if key_text.strip():
            print(key_text.strip())
        else:
            # Fallback: search full text for key phrases
            for line in full_text.split('\n'):
                ls = line.strip().lower()
                if any(p in ls for p in ['minimum', 'academic', 'hours', 'open water dive',
                                          'confined', 'training dive', 'presentations',
                                          'knowledge session', 'pool dive']):
                    print(line)
