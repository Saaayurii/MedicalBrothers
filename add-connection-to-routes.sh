#!/bin/bash

# Script to add connection() import and call to all API routes

find app/api -name "route.ts" -type f | while IFS= read -r file; do
  # Check if file already has connection import
  if ! grep -q "import.*connection.*from.*next/server" "$file"; then
    # Check if file has any imports
    if grep -q "^import" "$file"; then
      # Find first import line and add connection import before it
      first_import=$(grep -n "^import" "$file" | head -1 | cut -d: -f1)
      sed -i "${first_import}i import { connection } from 'next/server';" "$file"
      echo "✓ Added connection import to: $file"
    else
      # Add at beginning of file
      sed -i "1i import { connection } from 'next/server';\n" "$file"
      echo "✓ Added connection import to: $file"
    fi
  fi

  # Now add await connection() call at start of each export function
  # Find all export async function lines
  sed -i '/export async function \(GET\|POST\|PUT\|DELETE\|PATCH\)/,/^{/{
    /^{/a\  await connection();
  }' "$file"
done

echo ""
echo "Done! All API routes now have connection() calls."
