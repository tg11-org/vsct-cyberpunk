#!/usr/bin/env bash

# Usage:
#   ./gitpush.sh "commit message"
#   ./gitpush.sh "commit message" file1 folder2
#   ./gitpush.sh
#
# If no files/folders are specified, it stages everything.

set -e

COMMIT_MSG="$1"

if [ -z "$COMMIT_MSG" ]; then
    read -rp "Commit message: " COMMIT_MSG
fi

if [ -z "$COMMIT_MSG" ]; then
    echo "No commit message provided. Aborting."
    exit 1
fi

shift || true

if [ "$#" -eq 0 ]; then
    echo "Staging all changes..."
    git add .
else
    echo "Staging specified files/folders..."
    git add "$@"
fi

if git diff --cached --quiet; then
    echo "No staged changes to commit."
    exit 0
fi

echo "Committing..."
git commit -m "$COMMIT_MSG"

if git rev-parse --abbrev-ref --symbolic-full-name "@{u}" >/dev/null 2>&1; then
    echo "Pushing..."
    git push
else
    BRANCH_NAME="$(git branch --show-current)"
    echo "Pushing and setting upstream..."
    git push -u origin "$BRANCH_NAME"
fi

echo "Done."
