#!/usr/bin/env bash
# =============================================================================
# scripts/test-teams-features.sh
#
# Automated Teams Tier Feature Testing Script
#
# Runs the full Teams tier test suite and generates an HTML/JSON report.
#
# Usage:
#   ./scripts/test-teams-features.sh [--tier=<basic|premium|enterprise|all>]
#                                    [--report] [--e2e] [--verbose]
#
# Options:
#   --tier=<tier>   Run tests for a specific tier only (default: all)
#   --report        Generate an HTML report after running tests
#   --e2e           Also run Playwright E2E tests (requires Playwright)
#   --verbose       Show full test output
#   --help          Show this help message
#
# Examples:
#   ./scripts/test-teams-features.sh
#   ./scripts/test-teams-features.sh --tier=premium
#   ./scripts/test-teams-features.sh --report --verbose
#   ./scripts/test-teams-features.sh --e2e --report
#
# Requirements:
#   - Node.js 18+
#   - npm dependencies installed (npm install)
#   - For E2E: @playwright/test installed + browsers (npx playwright install)
# =============================================================================

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPORT_DIR="${ROOT_DIR}/test-results"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TIER="all"
RUN_REPORT=false
RUN_E2E=false
VERBOSE=false

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Argument parsing ──────────────────────────────────────────────────────────
for arg in "$@"; do
    case "${arg}" in
        --tier=*)    TIER="${arg#*=}" ;;
        --report)    RUN_REPORT=true ;;
        --e2e)       RUN_E2E=true ;;
        --verbose)   VERBOSE=true ;;
        --help|-h)
            head -35 "${BASH_SOURCE[0]}" | tail -30
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: ${arg}${RESET}" >&2
            exit 1
            ;;
    esac
done

# ── Helpers ───────────────────────────────────────────────────────────────────
log()     { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[PASS]${RESET}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
fail()    { echo -e "${RED}[FAIL]${RESET}  $*"; }
header()  { echo -e "\n${BOLD}${BLUE}━━━ $* ━━━${RESET}"; }

# Verify we are in the project root
cd "${ROOT_DIR}"

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║     RESILIENCE ATLAS — Teams Tier Feature Test Runner        ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""
log "Root directory : ${ROOT_DIR}"
log "Report dir     : ${REPORT_DIR}"
log "Tier filter    : ${TIER}"
log "Generate report: ${RUN_REPORT}"
log "Run E2E        : ${RUN_E2E}"
echo ""

# ── Pre-flight checks ─────────────────────────────────────────────────────────
header "Pre-flight checks"

if ! command -v node &>/dev/null; then
    fail "Node.js is not installed. Please install Node.js 18+."
    exit 1
fi

NODE_VERSION="$(node -e 'process.stdout.write(process.version)')"
log "Node.js version: ${NODE_VERSION}"

if [ ! -d "${ROOT_DIR}/node_modules" ]; then
    warn "node_modules not found — running npm install..."
    npm install --silent
fi

if [ ! -f "${ROOT_DIR}/node_modules/.bin/jest" ]; then
    fail "Jest not found. Run: npm install"
    exit 1
fi

success "Pre-flight checks passed"

# ── Create report directory ───────────────────────────────────────────────────
mkdir -p "${REPORT_DIR}"

# ── Build jest options ────────────────────────────────────────────────────────
JEST_OPTS="--forceExit --no-coverage"

if [ "${VERBOSE}" = true ]; then
    JEST_OPTS="${JEST_OPTS} --verbose"
fi

# Build JSON report path
JSON_REPORT="${REPORT_DIR}/teams-tier-results-${TIMESTAMP}.json"
JEST_OPTS="${JEST_OPTS} --json --outputFile=${JSON_REPORT}"

# ── Run unit tests ────────────────────────────────────────────────────────────
header "Running Teams Tier Unit Tests"

UNIT_TESTS="tests/teams-tier-verification.test.js"
UNIT_EXIT=0

if [ "${VERBOSE}" = true ]; then
    # shellcheck disable=SC2086
    node_modules/.bin/jest ${JEST_OPTS} "${UNIT_TESTS}" || UNIT_EXIT=$?
else
    # shellcheck disable=SC2086
    node_modules/.bin/jest ${JEST_OPTS} "${UNIT_TESTS}" 2>&1 | \
        grep -E "PASS|FAIL|Tests:|Test Suites:|✓|✗|×|●" || UNIT_EXIT=$?
fi

# Read results from JSON if available
if [ -f "${JSON_REPORT}" ]; then
    TOTAL_TESTS="$(node -e "const r=require('${JSON_REPORT}'); console.log(r.numTotalTests||0);" 2>/dev/null || echo "?")"
    PASSED_TESTS="$(node -e "const r=require('${JSON_REPORT}'); console.log(r.numPassedTests||0);" 2>/dev/null || echo "?")"
    FAILED_TESTS="$(node -e "const r=require('${JSON_REPORT}'); console.log(r.numFailedTests||0);" 2>/dev/null || echo "?")"
else
    TOTAL_TESTS="?"
    PASSED_TESTS="?"
    FAILED_TESTS="?"
fi

echo ""
if [ "${UNIT_EXIT}" -eq 0 ]; then
    success "Unit tests: ${PASSED_TESTS}/${TOTAL_TESTS} passed"
else
    fail "Unit tests: ${FAILED_TESTS} failed (${PASSED_TESTS}/${TOTAL_TESTS} passed)"
fi

# ── Run tier-specific filter tests ───────────────────────────────────────────
if [ "${TIER}" != "all" ]; then
    header "Running Tier-Specific Tests — ${TIER}"

    TIER_FILTER=""
    case "${TIER}" in
        basic|starter)     TIER_FILTER="Basic|starter" ;;
        premium|pro)       TIER_FILTER="Premium|pro" ;;
        enterprise)        TIER_FILTER="Enterprise|enterprise" ;;
        *)
            warn "Unknown tier '${TIER}'. Running all tests instead."
            TIER_FILTER=""
            ;;
    esac

    if [ -n "${TIER_FILTER}" ]; then
        TIER_EXIT=0
        # shellcheck disable=SC2086
        node_modules/.bin/jest --forceExit --verbose \
            "${UNIT_TESTS}" \
            --testNamePattern="${TIER_FILTER}" || TIER_EXIT=$?

        if [ "${TIER_EXIT}" -eq 0 ]; then
            success "Tier-specific tests for '${TIER}' passed"
        else
            fail "Tier-specific tests for '${TIER}' had failures"
        fi
    fi
fi

# ── Run existing tier-adjacent tests ─────────────────────────────────────────
header "Running Existing Tier Tests (tierUtils, teams-resources)"

EXISTING_EXIT=0
EXISTING_JSON="${REPORT_DIR}/existing-tier-results-${TIMESTAMP}.json"

# shellcheck disable=SC2086
node_modules/.bin/jest --forceExit \
    --json --outputFile="${EXISTING_JSON}" \
    "tests/tierUtils.test.js" "tests/teams-resources.test.js" 2>&1 | \
    grep -E "PASS|FAIL|Tests:|Test Suites:" || EXISTING_EXIT=$?

if [ "${EXISTING_EXIT}" -eq 0 ]; then
    success "Existing tier tests passed"
else
    fail "Existing tier tests had failures"
fi

# ── Run E2E tests (optional) ──────────────────────────────────────────────────
E2E_EXIT=0
if [ "${RUN_E2E}" = true ]; then
    header "Running Playwright E2E Tests"

    if ! command -v npx &>/dev/null; then
        warn "npx not found — skipping E2E tests"
        E2E_EXIT=1
    elif ! node_modules/.bin/playwright --version &>/dev/null 2>&1; then
        warn "Playwright not installed. Run: npm install --save-dev @playwright/test && npx playwright install"
        warn "Skipping E2E tests."
        E2E_EXIT=1
    else
        E2E_REPORT="${REPORT_DIR}/e2e-report-${TIMESTAMP}"
        node_modules/.bin/playwright test \
            tests/teams-tier-e2e.spec.js \
            --reporter=html,json \
            --output="${E2E_REPORT}" || E2E_EXIT=$?

        if [ "${E2E_EXIT}" -eq 0 ]; then
            success "E2E tests passed"
        else
            warn "E2E tests had failures (some tests require a running server)"
        fi
    fi
fi

# ── Generate HTML report ──────────────────────────────────────────────────────
if [ "${RUN_REPORT}" = true ]; then
    header "Generating HTML Report"

    HTML_REPORT="${REPORT_DIR}/teams-tier-report-${TIMESTAMP}.html"

    REPORT_DIR="${REPORT_DIR}" TIMESTAMP="${TIMESTAMP}" node - <<'EOF'
const fs   = require('fs');
const path = require('path');

const reportDir = process.env.REPORT_DIR || path.join(process.cwd(), 'test-results');
const timestamp = process.env.TIMESTAMP  || new Date().toISOString();

// Find the most recent JSON report
const jsonFiles = fs.readdirSync(reportDir)
    .filter(f => f.startsWith('teams-tier-results-') && f.endsWith('.json'))
    .sort()
    .reverse();

if (jsonFiles.length === 0) {
    console.error('No JSON report found in', reportDir);
    process.exit(1);
}

const jsonPath = path.join(reportDir, jsonFiles[0]);
const data     = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const suites = (data.testResults || []).flatMap(s =>
    (s.testResults || []).map(t => ({
        suite:    (t.ancestorTitles || []).join(' › '),
        name:     t.title,
        status:   t.status,
        duration: t.duration || 0,
    }))
);

const total  = suites.length;
const passed = suites.filter(t => t.status === 'passed').length;
const failed = suites.filter(t => t.status === 'failed').length;
const pct    = total > 0 ? Math.round((passed / total) * 100) : 0;

const rows = suites.map(t => `
    <tr class="${t.status}">
        <td>${t.suite}</td>
        <td>${t.name}</td>
        <td class="status">${t.status === 'passed' ? '✅' : '❌'} ${t.status}</td>
        <td>${t.duration}ms</td>
    </tr>`).join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teams Tier Test Report — Resilience Atlas</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; background: #f8f9fa; color: #333; }
        header { background: #1a3a5c; color: #fff; padding: 24px 40px; }
        header h1 { margin: 0 0 4px; font-size: 24px; }
        header p  { margin: 0; opacity: .7; }
        .summary { display: flex; gap: 24px; padding: 24px 40px; background: #fff; border-bottom: 1px solid #e0e0e0; }
        .card { flex: 1; background: #f0f4ff; border-radius: 8px; padding: 16px 20px; text-align: center; }
        .card.fail { background: #fff0f0; }
        .card h2 { margin: 0; font-size: 36px; }
        .card p  { margin: 4px 0 0; font-size: 13px; opacity: .7; }
        .progress { height: 8px; background: #e0e0e0; border-radius: 4px; margin: 16px 40px; }
        .bar { height: 8px; background: #22c55e; border-radius: 4px; transition: width .5s; }
        table { width: calc(100% - 80px); margin: 0 40px 40px; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
        th { background: #1a3a5c; color: #fff; padding: 10px 14px; text-align: left; font-size: 13px; }
        td { padding: 8px 14px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
        tr:last-child td { border-bottom: none; }
        tr.passed td { background: #fff; }
        tr.failed td { background: #fff8f8; }
        .status { font-weight: 600; }
        .meta { padding: 8px 40px; font-size: 12px; color: #888; }
    </style>
</head>
<body>
    <header>
        <h1>🛡️ Teams Tier Feature Test Report</h1>
        <p>Resilience Atlas — Automated Tier Verification</p>
    </header>
    <div class="summary">
        <div class="card"><h2>${total}</h2><p>Total Tests</p></div>
        <div class="card"><h2>${passed}</h2><p>Passed ✅</p></div>
        <div class="card fail"><h2>${failed}</h2><p>Failed ❌</p></div>
        <div class="card"><h2>${pct}%</h2><p>Pass Rate</p></div>
    </div>
    <div class="progress"><div class="bar" style="width:${pct}%"></div></div>
    <p class="meta">Generated: ${new Date().toISOString()} &nbsp;|&nbsp; Source: ${jsonFiles[0]}</p>
    <table>
        <thead><tr><th>Test Suite</th><th>Test Name</th><th>Status</th><th>Duration</th></tr></thead>
        <tbody>${rows}</tbody>
    </table>
</body>
</html>`;

const outPath = path.join(reportDir, 'teams-tier-report-' + Date.now() + '.html');
fs.writeFileSync(outPath, html);
console.log('Report written to:', outPath);
EOF

    REPORT_STATUS=$?
    if [ "${REPORT_STATUS}" -eq 0 ]; then
        success "HTML report generated in ${REPORT_DIR}/"
    else
        warn "HTML report generation encountered an issue"
    fi
fi

# ── Final summary ─────────────────────────────────────────────────────────────
header "Summary"

echo ""
echo -e "  ${BOLD}Unit tests:${RESET}      $([ "${UNIT_EXIT}" -eq 0 ] && echo -e "${GREEN}PASS${RESET}" || echo -e "${RED}FAIL${RESET}")"
echo -e "  ${BOLD}Existing tests:${RESET}  $([ "${EXISTING_EXIT}" -eq 0 ] && echo -e "${GREEN}PASS${RESET}" || echo -e "${RED}FAIL${RESET}")"
if [ "${RUN_E2E}" = true ]; then
    echo -e "  ${BOLD}E2E tests:${RESET}       $([ "${E2E_EXIT}" -eq 0 ] && echo -e "${GREEN}PASS${RESET}" || echo -e "${YELLOW}SKIP/WARN${RESET}")"
fi
if [ -n "${TOTAL_TESTS}" ] && [ "${TOTAL_TESTS}" != "?" ]; then
    echo ""
    echo -e "  ${BOLD}Tests run:${RESET}       ${TOTAL_TESTS}"
    echo -e "  ${BOLD}Tests passed:${RESET}    ${PASSED_TESTS}"
    echo -e "  ${BOLD}Tests failed:${RESET}    ${FAILED_TESTS}"
fi
echo ""

OVERALL_EXIT=0
if [ "${UNIT_EXIT}" -ne 0 ] || [ "${EXISTING_EXIT}" -ne 0 ]; then
    OVERALL_EXIT=1
fi

if [ "${OVERALL_EXIT}" -eq 0 ]; then
    echo -e "${BOLD}${GREEN}✅  All Teams tier tests passed!${RESET}"
else
    echo -e "${BOLD}${RED}❌  Some tests failed — see output above for details.${RESET}"
fi

echo ""
exit "${OVERALL_EXIT}"
