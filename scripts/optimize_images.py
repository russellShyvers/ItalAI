#!/usr/bin/env python3
"""
WebP Converter for ItalAI
Converts all PNG and JPEG images to WebP format
"""

import os
from pathlib import Path
from PIL import Image
import sys

# Configuration
IMAGE_DIR = "assets/images"
QUALITY = 85  # WebP quality (1-100, 85 is a good balance)
DELETE_ORIGINALS = False  # Set to True to delete original files after conversion
SKIP_EXISTING = True  # Skip if WebP already exists

# Source formats to convert
SOURCE_FORMATS = {'.jpg', '.jpeg', '.png'}

def get_file_size(filepath):
    """Get file size in KB"""
    return os.path.getsize(filepath) / 1024

def convert_to_webp(filepath):
    """Convert image to WebP format"""
    try:
        # Check if already converted
        webp_path = filepath.with_suffix('.webp')
        if SKIP_EXISTING and webp_path.exists():
            return {
                'status': 'skipped',
                'path': filepath,
                'reason': 'WebP already exists'
            }
        
        original_size = get_file_size(filepath)
        
        # Open and convert image
        img = Image.open(filepath)
        
        # Save as WebP
        img.save(webp_path, 'WEBP', quality=QUALITY, method=6)
        
        new_size = get_file_size(webp_path)
        saved = original_size - new_size
        percent = (saved / original_size * 100) if original_size > 0 else 0
        
        # Delete original if requested
        if DELETE_ORIGINALS:
            os.remove(filepath)
            deleted = True
        else:
            deleted = False
        
        return {
            'status': 'converted',
            'path': filepath,
            'webp_path': webp_path,
            'original_size': original_size,
            'new_size': new_size,
            'saved': saved,
            'percent': percent,
            'deleted': deleted
        }
    
    except Exception as e:
        return {
            'status': 'error',
            'path': filepath,
            'error': str(e)
        }

def update_html_references(image_dir):
    """Scan HTML files and report image references that need updating"""
    print("\n" + "="*60)
    print("HTML REFERENCE SCAN")
    print("="*60)
    
    project_root = Path(image_dir).parent.parent
    html_files = list(project_root.rglob("*.html")) + list(project_root.rglob("*.md"))
    
    references = []
    for html_file in html_files:
        try:
            content = html_file.read_text()
            for ext in SOURCE_FORMATS:
                if ext in content:
                    references.append(html_file)
                    break
        except:
            pass
    
    if references:
        print(f"\n⚠️  Found {len(references)} files with image references to update:")
        for ref in references[:10]:  # Show first 10
            print(f"   - {ref.relative_to(project_root)}")
        if len(references) > 10:
            print(f"   ... and {len(references) - 10} more")
        print("\n💡 Update these files to use .webp extensions")
    else:
        print("\n✓ No HTML files need updating (or all already use .webp)")

def main():
    """Main conversion routine"""
    print("🖼️  ItalAI WebP Converter\n")
    print(f"Configuration:")
    print(f"  - Quality: {QUALITY}")
    print(f"  - Delete originals: {DELETE_ORIGINALS}")
    print(f"  - Skip existing: {SKIP_EXISTING}\n")
    
    # Find all images
    image_dir = Path(IMAGE_DIR)
    if not image_dir.exists():
        print(f"❌ Directory not found: {IMAGE_DIR}")
        sys.exit(1)
    
    images = []
    for ext in SOURCE_FORMATS:
        images.extend(image_dir.rglob(f"*{ext}"))
    
    if not images:
        print(f"✓ No PNG/JPEG images found in {IMAGE_DIR}")
        print("All images are already WebP format!")
        return
    
    print(f"Found {len(images)} images to convert\n")
    
    # Convert each image
    converted = []
    skipped = []
    errors = []
    
    for i, img_path in enumerate(images, 1):
        print(f"[{i}/{len(images)}] Converting {img_path.name}...", end=' ')
        result = convert_to_webp(img_path)
        
        if result['status'] == 'converted':
            converted.append(result)
            print(f"✓ Saved {result['saved']:.1f}KB ({result['percent']:.1f}%)")
        elif result['status'] == 'skipped':
            skipped.append(result)
            print(f"⊘ {result['reason']}")
        else:
            errors.append(result)
            print(f"✗ {result.get('error', 'Failed')}")
    
    # Summary
    print("\n" + "="*60)
    print("CONVERSION SUMMARY")
    print("="*60)
    
    if converted:
        total_original = sum(r['original_size'] for r in converted)
        total_new = sum(r['new_size'] for r in converted)
        total_saved = total_original - total_new
        total_percent = (total_saved / total_original * 100) if total_original > 0 else 0
        
        print(f"✓ Converted: {len(converted)} images")
        print(f"  Original size: {total_original:.1f}KB")
        print(f"  WebP size: {total_new:.1f}KB")
        print(f"  Total saved: {total_saved:.1f}KB ({total_percent:.1f}%)")
    
    if skipped:
        print(f"⊘ Skipped: {len(skipped)} images (WebP already exists)")
    
    if errors:
        print(f"✗ Errors: {len(errors)} images failed")
    
    if converted:
        print(f"\n✨ Successfully converted {len(converted)} images to WebP!")
        if not DELETE_ORIGINALS:
            print(f"💡 Original files preserved. Set DELETE_ORIGINALS=True to remove them.")
    
    # Check for HTML references
    update_html_references(image_dir)

if __name__ == "__main__":
    main()
