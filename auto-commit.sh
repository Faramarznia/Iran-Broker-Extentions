#!/bin/bash
# auto-commit.sh
# Watches for file changes and commits automatically with Conventional Commits format.
#
# Usage:
#   ./auto-commit.sh              — start watcher (default interval: 15s)
#   ./auto-commit.sh --interval 30  — custom poll interval in seconds
#   ./auto-commit.sh --stop       — stop the running watcher

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
POLL=15
PID_FILE="$REPO_DIR/.auto-commit.pid"
LOG_FILE="$REPO_DIR/.auto-commit.log"

# --- parse args ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --interval) POLL="$2"; shift 2 ;;
    --stop)
      if [[ -f "$PID_FILE" ]]; then
        kill "$(cat "$PID_FILE")" 2>/dev/null && rm -f "$PID_FILE"
        echo "Watcher stopped."
      else
        echo "No watcher running."
      fi
      exit 0
      ;;
    *) shift ;;
  esac
done

# --- helpers ---

_log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

# Determine Conventional Commit type from list of changed files
_type() {
  local files="$1"
  local has_new="$2"

  # CSS-only → style
  if echo "$files" | grep -qE '\.(css)$' && ! echo "$files" | grep -qE '\.(js|html|json|md)$'; then
    echo "style"; return
  fi
  # Markdown/text-only → docs
  if echo "$files" | grep -qiE '\.(md|txt)$' && ! echo "$files" | grep -qE '\.(js|html|css|json)$'; then
    echo "docs"; return
  fi
  # Config/tooling files → chore
  if echo "$files" | grep -qE '(manifest\.json|package\.json|package-lock\.json|\.gitignore|tsconfig|webpack|rollup|vite)' \
     && ! echo "$files" | grep -qE '\.(js|html|css|md)$'; then
    echo "chore"; return
  fi
  # New files present → feat
  if [[ -n "$has_new" ]]; then echo "feat"; return; fi
  # Modifications only → fix (safest default for edits)
  echo "fix"
}

# Derive scope from directory of most-changed files
_scope() {
  local files="$1"
  if echo "$files" | grep -q "NewTab Extention"; then
    echo "newtab"
  elif echo "$files" | grep -q "Redesign Request"; then
    echo "redesign"
  fi
}

# Build a short, readable subject from file list
_subject() {
  local files="$1"
  local count
  count=$(echo "$files" | grep -c . 2>/dev/null || true)

  if [[ "$count" -le 3 ]]; then
    echo "$files" | while IFS= read -r f; do
      basename "$f"
    done | paste -sd ", "
  else
    # e.g. "8 files in newtab, redesign"
    local dirs
    dirs=$(echo "$files" | xargs -I{} dirname {} | sort -u | xargs -I{} basename {} | paste -sd ", ")
    echo "${count} files in ${dirs}"
  fi
}

# --- main loop ---

_watch() {
  echo $$ > "$PID_FILE"
  _log "Auto-commit watcher started (poll every ${POLL}s) — Ctrl-C or --stop to quit"

  while true; do
    sleep "$POLL"
    cd "$REPO_DIR" || exit 1

    # Collect untracked + modified (unstaged) files, excluding ignored
    UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null || true)
    MODIFIED=$(git diff --name-only 2>/dev/null || true)
    ALL=$(printf '%s\n%s\n' "$MODIFIED" "$UNTRACKED" | grep -v '^$' | sort -u)

    [[ -z "$ALL" ]] && continue

    TYPE=$(_type "$ALL" "$UNTRACKED")
    SCOPE=$(_scope "$ALL")
    SUBJECT=$(_subject "$ALL")

    if [[ -n "$SCOPE" ]]; then
      HEADER="${TYPE}(${SCOPE}): ${SUBJECT}"
    else
      HEADER="${TYPE}: ${SUBJECT}"
    fi

    # Conventional Commits: header ≤ 72 chars
    HEADER="${HEADER:0:72}"

    git add -A 2>/dev/null
    if git commit --quiet -m "$HEADER"; then
      _log "✔  $HEADER"
    else
      _log "✘  commit failed (nothing staged?)"
    fi
  done
}

_watch
