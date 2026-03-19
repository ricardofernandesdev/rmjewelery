#!/bin/bash
# Quick dev server restart with cache preservation
# Usage: bash dev.sh [--clean]

PORT=3000

# Kill existing server on port
npx kill-port $PORT 2>/dev/null

if [ "$1" = "--clean" ]; then
  echo "Cleaning .next cache..."
  rm -rf .next
fi

echo "Starting dev server..."
echo "First load of /admin will take ~15-20s (Payload compiles 3000+ modules)"
echo "After that, changes hot-reload instantly — just refresh the browser."
echo ""

npm run dev
