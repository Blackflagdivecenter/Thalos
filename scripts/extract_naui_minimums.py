#!/usr/bin/env python3
"""
Targeted extraction of NAUI course minimum requirements.
Focuses only on the POLICIES section of each course (academics, hours, dives).
"""

import pdfplumber
import re

PDF_PATH = "/Users/johnyoungblood/Library/Mobile Documents/com~apple~CloudDocs/NAUI Stuff/2026_NAUI_StandardsandPolicyManual.pdf"

# All courses from TOC with their starting pages
# Format: (course_name, start_page, end_page)
courses = [
    ("Tandem Scuba Diver", 61, 61),
    ("Introduction to Scuba (ISO 11121)", 64, 65),
    ("Scuba Diver (ISO 24801-1)", 68, 70),
    ("Supplied Air Snorkeling", 74, 74),
    ("Recreational Hookah Diver", 75, 80),
    ("Open Water Scuba Diver (ISO 24801-2)", 81, 89),
    ("Adaptive Scuba Diver", 90, 97),
    ("Experienced Scuba Diver", 98, 103),
    ("Refresher Scuba", 105, 109),
    ("Enriched Air Nitrox Diver (EANx)", 110, 113),
    ("Advanced Open Water Scuba Diver", 114, 117),
    ("Rescue Scuba Diver", 118, 122),
    ("Master Scuba Diver", 123, 126),
    ("Drysuit Diver", 127, 128),
    ("Full Face Mask Diver", 129, 132),
    ("Recreational DPV Diver", 133, 135),
    ("Sidemount Diver", 136, 139),
    ("Semi-Closed Rebreather (SCR) Diver", 140, 143),
    ("Closed Circuit Rebreather (CCR) Diver", 144, 147),
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
    ("Assistant Instructor (ISO 24802-1)", 194, 197),
    ("Divemaster (ISO 24801-3)", 198, 204),
    ("Divemaster Crossover Course (DMC)", 205, 211),
    ("Instructor (ISO 24802-2)", 212, 218),
    ("Instructor Crossover Course (ICC)", 219, 224),
    ("Instructor Trainer", 225, 226),
    ("Course Director", 227, 228),
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
    ("Public Safety Diver", 311, 316),
    ("Public Safety Diver Instructor", 318, 320),
    ("Public Safety Diver Instructor Examiner", 321, 322),
    ("Skin Diver / Snorkeling (ISO 13289)", 326, 329),
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
    ("Skin Diving Instructor (ISO 13970)", 356, 360),
    ("Freediver Supervisor", 361, 365),
    ("Freediver Instructor", 366, 369),
    ("Freediver Instructor Examiner", 370, 371),
    ("Basic Life Support CPR & First Aid", 376, 379),
    ("Emergency Oxygen for Scuba Diving", 380, 382),
    ("Diving First Aid (DFA)", 383, 387),
    ("NAUI First Aid Instructor", 389, 392),
    ("NAUI First Aid Instructor Trainer", 393, 396),
    ("International Diver Recognition", 398, 399),
    ("Young Aquatic Explorers", 400, 403),
    ("Breathing Gas Mixer Blender", 405, 407),
]

def extract_policies_section(text):
    """Extract the POLICIES section from a course page."""
    # Try to find POLICIES block
    lines = text.split('\n')
    result_lines = []
    in_policies = False
    in_practical = False

    for i, line in enumerate(lines):
        line_stripped = line.strip()

        # Start capturing at POLICIES or PRACTICAL APPLICATION
        if 'POLICIES' in line_stripped.upper() and not in_policies:
            in_policies = True

        if in_policies:
            result_lines.append(line)

        # Stop at REQUIREMENTS – ACADEMIC (start of next major section)
        if in_policies and ('REQUIREMENTS' in line_stripped.upper() and
                           ('ACADEMIC' in line_stripped.upper() or
                            'SKILLS' in line_stripped.upper() or
                            'EXAM' in line_stripped.upper())):
            break

    return '\n'.join(result_lines)


def extract_minimum_numbers(text):
    """Extract specific minimum numbers from course text."""
    results = {
        'academic_hours': None,
        'water_hours': None,
        'confined_water_hours': None,
        'confined_water_dives': None,
        'open_water_dives': None,
        'total_dives': None,
        'training_dives': None,
        'other_notes': [],
    }

    # Look for academic hours
    acad_patterns = [
        r'[Aa]cademics?\s*\(estimated hours?\)\.\s*([^\n]+)',
        r'[Aa]cademic\s+hours?\s*[:\.]?\s*(\d+)',
        r'(\d+)\s+hours?\s+(?:of\s+)?academics?',
    ]
    for pat in acad_patterns:
        m = re.search(pat, text)
        if m:
            results['academic_hours'] = m.group(1).strip()
            break

    # Look for minimum required hours
    hours_patterns = [
        r'MINIMUM REQUIRED HOURS[^\n]*\n\s*[▪•]\s*([^\n]+)',
        r'minimum\s+(?:number\s+of\s+)?(?:required\s+)?hours?\s+is\s+([^\n\.]+)',
        r'[Ww]ater\s+[Hh]ours[:\s]+([^\n]+)',
        r'(\d+)\s+hours?\s+(?:including\s+at\s+least\s+\d+\s+water\s+hours?)',
    ]
    for pat in hours_patterns:
        m = re.search(pat, text, re.MULTILINE)
        if m:
            results['water_hours'] = m.group(1).strip()
            break

    # Look for confined water dives
    confined_patterns = [
        r'minimum\s+number\s+of\s+confined\s+water\s+(?:training\s+)?dives?\s+is\s+(\w+)',
        r'confined\s+water\s+dives?\s*[:\.\-]\s*(\w+)',
        r'(\d+)\s+confined\s+water\s+(?:training\s+)?dives?',
        r'confined\s+water.*?(\d+)\s+dives?',
    ]
    for pat in confined_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            results['confined_water_dives'] = m.group(1).strip()
            break

    # Look for open water dives
    ow_patterns = [
        r'minimum\s+(?:required\s+)?number\s+of\s+open\s+water\s+dives?\s+is\s+(\w+)',
        r'minimum\s+(?:is\s+)?(\w+)\s+open\s+water\s+(?:training\s+)?dives?',
        r'(\w+)\s+\(\d+\)\s+open\s+water\s+(?:training\s+)?dives?',
        r'open\s+water\s+dives?\s*[:\.\-]\s*(\w+)',
    ]
    for pat in ow_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            results['open_water_dives'] = m.group(1).strip()
            break

    # Look for total dives
    total_patterns = [
        r'total\s+(?:of\s+)?(\d+)\s+(?:training\s+)?dives?',
        r'(\d+)\s+(?:training\s+)?dives?\s+(?:are\s+)?required',
        r'minimum\s+(?:of\s+)?(\d+)\s+dives?\s+(?:total|are\s+required)',
    ]
    for pat in total_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            results['total_dives'] = m.group(1).strip()
            break

    return results


with pdfplumber.open(PDF_PATH) as pdf:
    total_pages = len(pdf.pages)

    for course_name, start_pg, end_pg in courses:
        # Collect all text for this course
        full_text = []
        for pg_num in range(start_pg, min(end_pg + 1, total_pages + 1)):
            page_idx = pg_num - 1
            if page_idx < total_pages:
                page = pdf.pages[page_idx]
                text = page.extract_text()
                if text:
                    full_text.append(f"[Page {pg_num}]\n{text}")

        combined_text = '\n'.join(full_text)

        print(f"\n{'='*70}")
        print(f"COURSE: {course_name}")
        print(f"Pages: {start_pg}-{end_pg}")
        print('='*70)

        # Print the policies section
        policies = extract_policies_section(combined_text)
        if policies.strip():
            print(policies.strip())
        else:
            # Print sections that mention minimum or hours or dives
            for line in combined_text.split('\n'):
                lc = line.lower()
                if any(kw in lc for kw in ['minimum', 'academic', 'practical', 'hours', 'dives',
                                            'confined', 'open water', 'prerequisite', 'sessions']):
                    print(line)

        # Extract and print structured data
        nums = extract_minimum_numbers(combined_text)
        print(f"\n  >> EXTRACTED MINIMUMS:")
        for k, v in nums.items():
            if v and k != 'other_notes':
                print(f"     {k}: {v}")
