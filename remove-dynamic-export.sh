#!/bin/bash

# Script to remove dynamic export from all files

find app -type f \( -name "*.ts" -o -name "*.tsx" \) | while IFS= read -r file; do
  if grep -q "// Force dynamic rendering" "$file"; then
    # Remove the comment and export line
    sed -i '/\/\/ Force dynamic rendering/d' "$file"
    sed -i "/^export const dynamic = 'force-dynamic';$/d" "$file"
    # Remove empty lines that might be left
    sed -i '/^$/N;/^\n$/d' "$file"
    echo "✓ Removed dynamic export from: $file"
  fi
done

echo ""
echo "Done! All dynamic exports have been removed."
