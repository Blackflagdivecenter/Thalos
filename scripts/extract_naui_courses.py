#!/usr/bin/env python3
"""
Extract NAUI course minimum requirements from the 2026 Standards and Policy Manual PDF.
"""

import pdfplumber
import re
import sys

PDF_PATH = "/Users/johnyoungblood/Library/Mobile Documents/com~apple~CloudDocs/NAUI Stuff/2026_NAUI_StandardsandPolicyManual.pdf"

def extract_all_text(pdf_path):
    """Extract all text from the PDF, page by page."""
    all_pages = []
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        print(f"Total pages: {total}", file=sys.stderr)
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                all_pages.append((i + 1, text))
    return all_pages

def find_relevant_pages(pages):
    """Find pages containing course minimum requirements."""
    # Keywords that indicate course standards/minimums sections
    keywords = [
        r'minimum',
        r'academic session',
        r'knowledge session',
        r'confined water',
        r'open water',
        r'training dive',
        r'course requirement',
        r'pool session',
        r'scuba dive',
        r'prerequisites',
        r'minimum number',
        r'presentations',
        r'dives required',
    ]

    course_keywords = [
        r'open water',
        r'advanced',
        r'rescue',
        r'divemaster',
        r'assistant instructor',
        r'instructor',
        r'skin diver',
        r'snorkeler',
        r'specialty',
        r'nitrox',
        r'freediving',
        r'cave',
        r'cavern',
        r'wreck',
        r'night',
        r'deep',
        r'navigation',
        r'search and recovery',
        r'underwater',
    ]

    relevant = []
    for page_num, text in pages:
        text_lower = text.lower()
        has_min = any(re.search(kw, text_lower) for kw in keywords)
        has_course = any(re.search(kw, text_lower) for kw in course_keywords)
        if has_min and has_course:
            relevant.append((page_num, text))

    return relevant

def find_section_pages(pages, start_markers, end_markers=None):
    """Find pages within a specific section."""
    in_section = False
    section_pages = []

    for page_num, text in pages:
        text_lower = text.lower()

        # Check if we're entering the section
        if not in_section:
            if any(re.search(marker, text_lower) for marker in start_markers):
                in_section = True

        if in_section:
            section_pages.append((page_num, text))

            # Check if we're leaving the section
            if end_markers and any(re.search(marker, text_lower) for marker in end_markers):
                in_section = False
                break

    return section_pages

def main():
    print("=" * 80)
    print("NAUI Standards and Policy Manual - Course Requirements Extraction")
    print("=" * 80)

    print("\nLoading PDF...", file=sys.stderr)
    all_pages = extract_all_text(PDF_PATH)
    print(f"Extracted text from {len(all_pages)} pages", file=sys.stderr)

    # First pass: find all pages with "minimum" in context of training
    print("\n" + "=" * 80)
    print("PASS 1: Pages containing minimum requirements")
    print("=" * 80)

    relevant = find_relevant_pages(all_pages)
    print(f"Found {len(relevant)} relevant pages", file=sys.stderr)

    for page_num, text in relevant:
        print(f"\n{'=' * 60}")
        print(f"PAGE {page_num}")
        print('=' * 60)
        print(text)

    # Second pass: look for tables of requirements
    print("\n" + "=" * 80)
    print("PASS 2: Full text search for course standards sections")
    print("=" * 80)

    # Look for sections titled "Training Standards" or similar
    section_markers = [
        r'training standard',
        r'course standard',
        r'minimum requirement',
        r'standards and requirement',
    ]

    for page_num, text in all_pages:
        text_lower = text.lower()
        for marker in section_markers:
            if re.search(marker, text_lower):
                print(f"\n{'=' * 60}")
                print(f"PAGE {page_num} [matched: {marker}]")
                print('=' * 60)
                print(text)
                break

    # Third pass: look for specific course name patterns followed by numbers
    print("\n" + "=" * 80)
    print("PASS 3: Pages with structured course data (numbers + dives)")
    print("=" * 80)

    dive_pattern = re.compile(r'\d+\s*(dive|session|presentation)', re.IGNORECASE)

    for page_num, text in all_pages:
        matches = dive_pattern.findall(text)
        if len(matches) >= 3:  # Page has multiple dive/session numbers
            text_lower = text.lower()
            course_kws = ['open water', 'advanced', 'rescue', 'divemaster', 'instructor',
                         'nitrox', 'specialty', 'skin diver', 'snorkel']
            if any(kw in text_lower for kw in course_kws):
                print(f"\n{'=' * 60}")
                print(f"PAGE {page_num} [structured data with {len(matches)} dive/session refs]")
                print('=' * 60)
                print(text)

    # Fourth pass: extract pages with tables (pdfplumber table extraction)
    print("\n" + "=" * 80)
    print("PASS 4: Table extraction from relevant pages")
    print("=" * 80)

    with pdfplumber.open(PDF_PATH) as pdf:
        for i, page in enumerate(pdf.pages):
            page_num = i + 1
            tables = page.extract_tables()
            if tables:
                # Check if any table cell contains dive/course keywords
                all_cells = []
                for table in tables:
                    for row in table:
                        for cell in row:
                            if cell:
                                all_cells.append(str(cell).lower())

                all_cells_text = ' '.join(all_cells)
                has_dive = any(kw in all_cells_text for kw in
                              ['dive', 'session', 'minimum', 'water', 'academic', 'confined'])

                if has_dive:
                    print(f"\n{'=' * 60}")
                    print(f"PAGE {page_num} - TABLES FOUND")
                    print('=' * 60)
                    for t_idx, table in enumerate(tables):
                        print(f"\n  Table {t_idx + 1}:")
                        for row in table:
                            row_str = ' | '.join(str(cell) if cell else '' for cell in row)
                            print(f"    {row_str}")

    print("\n" + "=" * 80)
    print("EXTRACTION COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    main()
