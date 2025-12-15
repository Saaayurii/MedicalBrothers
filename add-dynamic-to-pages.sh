#!/bin/bash

# Script to add dynamic export to all page.tsx files

find app -name "page.tsx" -type f | while IFS= read -r file; do
  # Check if file already has dynamic export
  if ! grep -q "export const dynamic" "$file"; then
    # Create temp file with new content
    {
      # Find last import line
      last_import=$(grep -n "^import\|^'use" "$file" | tail -1 | cut -d: -f1)

      if [ -n "$last_import" ] && [ "$last_import" -gt 0 ]; then
        # Add after last import or 'use client'/'use server'
        head -n "$last_import" "$file"
        echo ""
        echo "// Force dynamic rendering for this page"
        echo "export const dynamic = 'force-dynamic';"
        tail -n +"$((last_import + 1))" "$file"
      else
        # Add at beginning
        echo "// Force dynamic rendering for this page"
        echo "export const dynamic = 'force-dynamic';"
        echo ""
        cat "$file"
      fi
    } > "${file}.tmp"

    mv "${file}.tmp" "$file"
    echo "✓ Added dynamic export to: $file"
  else
    echo "○ Already has dynamic export: $file"
  fi
done

echo ""
echo "Done! All pages now have dynamic export."
