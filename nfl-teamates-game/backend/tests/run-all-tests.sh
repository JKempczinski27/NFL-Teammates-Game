#!/bin/bash

###############################################################################
# NFL Teammates Game - Test Runner Script
# Runs all tests with proper configuration and reporting
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="${BACKEND_DIR}/test-reports/${TIMESTAMP}"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  NFL Teammates Game - Comprehensive Test Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Create report directory
mkdir -p "${REPORT_DIR}"
echo -e "${GREEN}✓${NC} Report directory created: ${REPORT_DIR}"

# Change to backend directory
cd "${BACKEND_DIR}"

# Function to print section header
print_header() {
  echo ""
  echo -e "${BLUE}───────────────────────────────────────────────────────────${NC}"
  echo -e "${BLUE} $1${NC}"
  echo -e "${BLUE}───────────────────────────────────────────────────────────${NC}"
  echo ""
}

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Verify dependencies
print_header "Verifying Dependencies"

if ! command_exists node; then
  echo -e "${RED}✗${NC} Node.js is not installed"
  exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node --version)"

if ! command_exists npm; then
  echo -e "${RED}✗${NC} npm is not installed"
  exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  print_header "Installing Dependencies"
  npm install
fi

# Check for .env file
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠${NC} Warning: .env file not found"
  echo "  Integration tests and load tests may fail"
fi

# Parse command line arguments
RUN_UNIT=true
RUN_INTEGRATION=false
RUN_LOAD=false
LOAD_TEST_TYPE="baseline"

while [[ $# -gt 0 ]]; do
  case $1 in
    --all)
      RUN_UNIT=true
      RUN_INTEGRATION=true
      RUN_LOAD=true
      shift
      ;;
    --unit)
      RUN_UNIT=true
      RUN_INTEGRATION=false
      RUN_LOAD=false
      shift
      ;;
    --integration)
      RUN_INTEGRATION=true
      RUN_UNIT=false
      RUN_LOAD=false
      shift
      ;;
    --load)
      RUN_LOAD=true
      RUN_UNIT=false
      RUN_INTEGRATION=false
      LOAD_TEST_TYPE="${2:-baseline}"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --all              Run all tests (unit, integration, load)"
      echo "  --unit             Run unit tests only (default)"
      echo "  --integration      Run integration tests only"
      echo "  --load [type]      Run load tests (baseline|normal|peak|spike|soak)"
      echo "  --help             Show this help message"
      echo ""
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Track test results
UNIT_PASSED=false
INTEGRATION_PASSED=false
LOAD_PASSED=false

# Run Unit Tests
if [ "$RUN_UNIT" = true ]; then
  print_header "Running Unit Tests"

  if npm run test:unit 2>&1 | tee "${REPORT_DIR}/unit-tests.log"; then
    echo -e "${GREEN}✓${NC} Unit tests passed"
    UNIT_PASSED=true
  else
    echo -e "${RED}✗${NC} Unit tests failed"
    UNIT_PASSED=false
  fi
fi

# Run Integration Tests
if [ "$RUN_INTEGRATION" = true ]; then
  print_header "Running Integration Tests"

  if [ -z "${DATABASE_URL}" ]; then
    echo -e "${YELLOW}⚠${NC} DATABASE_URL not set, skipping integration tests"
  else
    if npm run test:integration 2>&1 | tee "${REPORT_DIR}/integration-tests.log"; then
      echo -e "${GREEN}✓${NC} Integration tests passed"
      INTEGRATION_PASSED=true
    else
      echo -e "${RED}✗${NC} Integration tests failed"
      INTEGRATION_PASSED=false
    fi
  fi
fi

# Run Load Tests
if [ "$RUN_LOAD" = true ]; then
  print_header "Running Load Tests: ${LOAD_TEST_TYPE}"

  echo -e "${YELLOW}⚠${NC} Load test will take significant time and resources"
  echo "Press Ctrl+C within 5 seconds to cancel..."
  sleep 5

  case $LOAD_TEST_TYPE in
    baseline)
      LOAD_SCRIPT="npm run load:baseline"
      ;;
    normal)
      LOAD_SCRIPT="npm run load:normal"
      ;;
    peak)
      LOAD_SCRIPT="npm run load:peak"
      ;;
    spike)
      LOAD_SCRIPT="npm run load:spike"
      ;;
    soak)
      LOAD_SCRIPT="npm run load:soak"
      ;;
    *)
      echo -e "${RED}✗${NC} Unknown load test type: ${LOAD_TEST_TYPE}"
      exit 1
      ;;
  esac

  if eval "$LOAD_SCRIPT" 2>&1 | tee "${REPORT_DIR}/load-test-${LOAD_TEST_TYPE}.log"; then
    echo -e "${GREEN}✓${NC} Load test (${LOAD_TEST_TYPE}) completed"
    LOAD_PASSED=true
  else
    echo -e "${RED}✗${NC} Load test (${LOAD_TEST_TYPE}) failed"
    LOAD_PASSED=false
  fi
fi

# Generate summary report
print_header "Test Summary"

echo "Test Execution Report - $(date)" > "${REPORT_DIR}/summary.txt"
echo "═══════════════════════════════════════════════════════════" >> "${REPORT_DIR}/summary.txt"
echo "" >> "${REPORT_DIR}/summary.txt"

TOTAL_TESTS=0
PASSED_TESTS=0

if [ "$RUN_UNIT" = true ]; then
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if [ "$UNIT_PASSED" = true ]; then
    echo -e "${GREEN}✓${NC} Unit Tests: PASSED"
    echo "✓ Unit Tests: PASSED" >> "${REPORT_DIR}/summary.txt"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗${NC} Unit Tests: FAILED"
    echo "✗ Unit Tests: FAILED" >> "${REPORT_DIR}/summary.txt"
  fi
fi

if [ "$RUN_INTEGRATION" = true ]; then
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if [ "$INTEGRATION_PASSED" = true ]; then
    echo -e "${GREEN}✓${NC} Integration Tests: PASSED"
    echo "✓ Integration Tests: PASSED" >> "${REPORT_DIR}/summary.txt"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗${NC} Integration Tests: FAILED"
    echo "✗ Integration Tests: FAILED" >> "${REPORT_DIR}/summary.txt"
  fi
fi

if [ "$RUN_LOAD" = true ]; then
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if [ "$LOAD_PASSED" = true ]; then
    echo -e "${GREEN}✓${NC} Load Tests (${LOAD_TEST_TYPE}): PASSED"
    echo "✓ Load Tests (${LOAD_TEST_TYPE}): PASSED" >> "${REPORT_DIR}/summary.txt"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗${NC} Load Tests (${LOAD_TEST_TYPE}): FAILED"
    echo "✗ Load Tests (${LOAD_TEST_TYPE}): FAILED" >> "${REPORT_DIR}/summary.txt"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════" >> "${REPORT_DIR}/summary.txt"
echo "Total: ${PASSED_TESTS}/${TOTAL_TESTS} test suites passed" >> "${REPORT_DIR}/summary.txt"
echo ""
echo -e "${BLUE}Total: ${PASSED_TESTS}/${TOTAL_TESTS} test suites passed${NC}"
echo ""
echo -e "Reports saved to: ${YELLOW}${REPORT_DIR}${NC}"

# Exit with appropriate code
if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  All tests passed! 🎉${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}  Some tests failed. Check reports for details.${NC}"
  echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
  exit 1
fi
