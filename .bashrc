#!/usr/bin/env bash
# .bashrc — Resilience Atlas developer helpers
#
# Add this function to your shell configuration (run once):
#   grep -qxF 'atlas()' ~/.bashrc || cat .bashrc >> ~/.bashrc
# Then reload:
#   source ~/.bashrc

# ── atlas() launcher ────────────────────────────────────────────────────────
# Starts the Resilience Atlas development server with nodemon.
# Run from the repository root, or set ATLAS_ROOT to the repo path.

atlas() {
    # Locate the repository root (directory containing backend/server.js)
    local repo_root
    if [[ -f "$(pwd)/backend/server.js" ]]; then
        repo_root="$(pwd)"
    elif [[ -n "${ATLAS_ROOT:-}" && -f "${ATLAS_ROOT}/backend/server.js" ]]; then
        repo_root="${ATLAS_ROOT}"
    else
        printf 'ERROR: Cannot find the Resilience Atlas repository.\n' >&2
        printf '       Run atlas from the repository root, or set ATLAS_ROOT.\n' >&2
        return 1
    fi

    # Load MONGODB_URI from .env if not already set in the environment
    if [[ -z "${MONGODB_URI:-}" && -f "${repo_root}/.env" ]]; then
        MONGODB_URI="$(grep -E '^MONGODB_URI=' "${repo_root}/.env" | head -1 | cut -d= -f2-)"
        export MONGODB_URI
    fi

    if [[ -z "${MONGODB_URI:-}" ]]; then
        printf 'WARNING: MONGODB_URI is not set. The server may fail to connect to MongoDB.\n' >&2
    fi

    # Check that nodemon is available
    if ! command -v nodemon &>/dev/null; then
        printf 'ERROR: nodemon is not installed. Run: npm install -g nodemon\n' >&2
        return 1
    fi

    cd "${repo_root}" || return 1
    printf 'Starting Resilience Atlas development server...\n'
    nodemon backend/server.js
}
