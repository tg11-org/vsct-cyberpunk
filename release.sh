#!/usr/bin/env bash

set -euo pipefail

if [ -z "${GITHUB_TOKEN:-}" ] && [ -f .env ]; then
  GITHUB_TOKEN="$(sed -n 's/^[[:space:]]*github_pat[[:space:]]*=[[:space:]]*//p' .env | head -n 1)"
  export GITHUB_TOKEN
fi

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "GITHUB_TOKEN is not set and github_pat was not found in .env"
  exit 1
fi

echo "Packaging extension and uploading latest VSIX to GitHub Release..."
npm run release:package:github
