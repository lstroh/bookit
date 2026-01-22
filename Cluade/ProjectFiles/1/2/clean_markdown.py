#!/usr/bin/env python3
"""
Clean markdown files for Claude Project Knowledge upload
Fixes encoding issues, smart quotes, and problematic characters
"""

import sys
import re
from pathlib import Path

def clean_markdown(content):
    """Clean markdown content of problematic characters"""
    
    # Replace smart quotes with regular quotes
    content = content.replace('"', '"').replace('"', '"')
    content = content.replace(''', "'").replace(''', "'")
    
    # Replace em dashes and en dashes with regular hyphens
    content = content.replace('—', '-').replace('–', '-')
    
    # Replace ellipsis
    content = content.replace('…', '...')
    
    # Remove zero-width spaces and other invisible characters
    content = content.replace('\u200b', '')  # Zero-width space
    content = content.replace('\ufeff', '')  # Zero-width no-break space
    content = content.replace('\u00a0', ' ')  # Non-breaking space to regular space
    
    # Fix multiple consecutive blank lines (more than 2)
    content = re.sub(r'\n{4,}', '\n\n\n', content)
    
    # Remove trailing whitespace from lines
    lines = content.split('\n')
    lines = [line.rstrip() for line in lines]
    content = '\n'.join(lines)
    
    # Ensure file ends with single newline
    content = content.rstrip() + '\n'
    
    return content

def process_file(filepath):
    """Process a single markdown file"""
    try:
        # Read with UTF-8 encoding
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Clean the content
        cleaned_content = clean_markdown(content)
        
        # Write back with UTF-8 encoding
        output_path = filepath.parent / f"{filepath.stem}_cleaned{filepath.suffix}"
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(cleaned_content)
        
        print(f"✓ Cleaned: {filepath.name} -> {output_path.name}")
        return True
        
    except Exception as e:
        print(f"✗ Error processing {filepath.name}: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python clean_markdown.py <file1.md> [file2.md] ...")
        print("   or: python clean_markdown.py *.md")
        sys.exit(1)
    
    files = [Path(f) for f in sys.argv[1:]]
    
    print(f"Cleaning {len(files)} file(s)...\n")
    
    success_count = 0
    for filepath in files:
        if filepath.exists() and filepath.suffix == '.md':
            if process_file(filepath):
                success_count += 1
        else:
            print(f"✗ Skipped: {filepath.name} (not found or not .md)")
    
    print(f"\n✓ Successfully cleaned {success_count}/{len(files)} files")
    print("Cleaned files have '_cleaned' suffix")

if __name__ == "__main__":
    main()