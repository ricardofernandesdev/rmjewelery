#!/usr/bin/env bash
# TypeScript validation script — runs tsc --noEmit and reports errors
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "Running TypeScript validation..."

OUTPUT=$(npx tsc --noEmit 2>&1) || true

if [ -z "$OUTPUT" ]; then
  echo "TypeScript: 0 errors"
  exit 0
else
  ERROR_COUNT=$(echo "$OUTPUT" | grep -c "error TS" || true)
  echo "$OUTPUT"
  echo ""
  echo "TypeScript: $ERROR_COUNT error(s) found"
  exit 1
fi
