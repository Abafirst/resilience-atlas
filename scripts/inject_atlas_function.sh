#!/usr/bin/env bash
# inject_atlas_function.sh
#
# Incremental update script for the Resilience Atlas development environment.
# Removes any existing atlas() function from ~/.bashrc and injects the latest
# version without touching any other custom configuration.
#
# Usage:
#   bash scripts/inject_atlas_function.sh
#
# After running, reload your shell:
#   source ~/.bashrc

set -euo pipefail

BASHRC="$HOME/.bashrc"

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
info()    { printf '\033[0;34m[INFO]\033[0m  %s\n' "$*"; }
success() { printf '\033[0;32m[OK]\033[0m    %s\n' "$*"; }
warn()    { printf '\033[0;33m[WARN]\033[0m  %s\n' "$*"; }

# ---------------------------------------------------------------------------
# 1. Create ~/.bashrc if it doesn't exist yet
# ---------------------------------------------------------------------------
if [[ ! -f "$BASHRC" ]]; then
    touch "$BASHRC"
    info "Created new ~/.bashrc"
fi

# ---------------------------------------------------------------------------
# 2. Remove any existing atlas() function block
#    Strategy: delete from the line containing "atlas() {" up to the matching
#    closing brace that sits alone on its own line, plus an optional trailing
#    blank line that we added as a separator.
# ---------------------------------------------------------------------------

# Use Python for reliable multi-line removal (avoids awk/sed portability issues)
if ! command -v python3 &>/dev/null; then
    printf '\033[0;31m[ERROR]\033[0m python3 is required but not found.\n' >&2
    printf '        Install Python 3 and re-run this script.\n' >&2
    exit 1
fi

python3 - "$BASHRC" << 'PYEOF'
import sys, re

path = sys.argv[1]
with open(path, 'r') as fh:
    content = fh.read()

# Match the atlas() function block: from the opening comment/line through the
# closing lone brace, including an optional blank separator line after it.
pattern = re.compile(
    r'\n?# ── atlas\(\) launcher.*?^}\n?',
    re.DOTALL | re.MULTILINE,
)
cleaned = pattern.sub('', content)

# Also remove a simpler block that has no comment header
pattern2 = re.compile(
    r'\natlas\s*\(\s*\)\s*\{.*?^}\n?',
    re.DOTALL | re.MULTILINE,
)
cleaned = pattern2.sub('', cleaned)

# Collapse more than two consecutive blank lines into two
cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

with open(path, 'w') as fh:
    fh.write(cleaned)
PYEOF

info "Removed any existing atlas() function from ~/.bashrc"

# ---------------------------------------------------------------------------
# 3. Inject the latest atlas() function at the end of ~/.bashrc
# ---------------------------------------------------------------------------
cat >> "$BASHRC" << 'ATLAS_EOF'

# ── atlas() launcher ────────────────────────────────────────────────────────

atlas() {
    local port=3000
    local max_port=3099

    # Find the first available port starting from 3000.
    # Both ss and netstat output :<port> followed by a space, tab, or newline,
    # so we match :<port> followed by a non-digit to avoid false positives like
    # :30001 when checking for 3000.
    while [[ $port -le $max_port ]]; do
        if ! ss -ltn 2>/dev/null | grep -qE ":${port}[^0-9]" && \
           ! netstat -ltn 2>/dev/null | grep -qE ":${port}[^0-9]"; then
            break
        fi
        port=$((port + 1))
    done

    if [[ $port -gt $max_port ]]; then
        printf '\033[0;31m[ERROR]\033[0m No free port found in range 3000-%s.\n' "$max_port" >&2
        return 1
    fi

    if [[ $port -ne 3000 ]]; then
        printf '\033[0;33m[WARN]\033[0m  Port 3000 is in use. Using port %s instead.\n' "$port"
    fi

    # Locate the repository root (directory containing backend/server.js)
    local repo_root
    if [[ -f "$(pwd)/backend/server.js" ]]; then
        repo_root="$(pwd)"
    elif [[ -n "${ATLAS_ROOT:-}" && -f "$ATLAS_ROOT/backend/server.js" ]]; then
        repo_root="$ATLAS_ROOT"
    else
        printf '\033[0;31m[ERROR]\033[0m Cannot find the Resilience Atlas repository.\n' >&2
        printf '        Run this command from the repository root, or set ATLAS_ROOT.\n' >&2
        return 1
    fi

    # Check that nodemon is available
    if ! command -v nodemon &>/dev/null; then
        printf '\033[0;31m[ERROR]\033[0m nodemon is not installed. Run: npm install -g nodemon\n' >&2
        return 1
    fi

    printf '\033[0;34m[INFO]\033[0m  Starting Resilience Atlas on port %s ...\n' "$port"

    # Start the server in the background with the chosen port
    PORT="$port" nodemon "$repo_root/backend/server.js" &
    local server_pid=$!

    # Wait for the server to be ready (poll with curl, timeout after 30 s)
    local url="http://localhost:${port}"
    local waited=0
    printf '\033[0;34m[INFO]\033[0m  Waiting for server to become ready'
    until curl -s --max-time 1 "$url" >/dev/null 2>&1; do
        if [[ $waited -ge 30 ]]; then
            printf '\n'
            printf '\033[0;33m[WARN]\033[0m  Server did not respond within 30 s. Opening browser anyway.\n'
            break
        fi
        printf '.'
        sleep 1
        waited=$((waited + 1))
    done
    printf '\n'

    # Open the browser — WSL / Windows integration
    if grep -qi microsoft /proc/version 2>/dev/null; then
        # Running inside WSL — open with the Windows default browser
        if command -v wslview &>/dev/null; then
            wslview "$url"
        elif command -v cmd.exe &>/dev/null; then
            cmd.exe /c start "" "$url"
        else
            printf '\033[0;33m[WARN]\033[0m  Cannot detect WSL browser helper. Open manually: %s\n' "$url"
        fi
    elif command -v xdg-open &>/dev/null; then
        xdg-open "$url"
    elif command -v open &>/dev/null; then
        open "$url"
    else
        printf '\033[0;33m[WARN]\033[0m  No browser opener found. Open manually: %s\n' "$url"
    fi

    printf '\033[0;32m[OK]\033[0m    Server running (PID %s). Press Ctrl+C to stop.\n' "$server_pid"
    wait "$server_pid"
}
ATLAS_EOF

# Ensure Unix line endings (convert CRLF → LF)
if command -v sed &>/dev/null; then
    sed -i 's/\r$//' "$BASHRC"
fi

success "atlas() function injected into ~/.bashrc"
info    "Reload your shell with:  source ~/.bashrc"
info    "Start the app with:      atlas"
