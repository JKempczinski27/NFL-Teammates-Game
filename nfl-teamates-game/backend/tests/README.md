# NFL Teammates Game - Test Suite

This directory contains comprehensive testing infrastructure for the NFL Teammates Game, designed to simulate NFL.com-level traffic and validate system performance.

## Directory Structure

```
tests/
├── unit/                           # Unit tests for individual components
│   └── api.unit.test.js           # API endpoint unit tests
├── integration/                    # Integration tests with database
│   └── database.integration.test.js # Database operations tests
├── load/                           # Load testing configurations
│   ├── baseline.yml               # Baseline load test (1k users)
│   ├── normal-traffic.yml         # Normal traffic (5k users)
│   ├── game-day-peak.yml          # Peak traffic (50k users)
│   ├── viral-spike.yml            # Viral spike test (25k users)
│   ├── soak-test.yml              # Long-duration stability (4 hours)
│   └── processors/
│       └── test-processor.js      # Custom Artillery functions
├── performance-monitor.js          # Real-time monitoring script
├── run-all-tests.sh               # Automated test runner
└── README.md                       # This file
```

## Quick Start

### Run All Unit Tests
```bash
npm run test:unit
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run Load Tests
```bash
# Baseline test (recommended to start)
npm run load:baseline

# Normal traffic
npm run load:normal

# Game day peak (⚠️ high load)
npm run load:peak

# Viral spike
npm run load:spike

# Soak test (4+ hours)
npm run load:soak
```

### Run Comprehensive Test Suite
```bash
# Using the automated script
./tests/run-all-tests.sh --all

# Or specific test types
./tests/run-all-tests.sh --unit
./tests/run-all-tests.sh --integration
./tests/run-all-tests.sh --load baseline
```

### Real-Time Monitoring
```bash
# Default 1-minute monitoring
node tests/performance-monitor.js

# Custom duration and interval
node tests/performance-monitor.js --duration 300000 --interval 10000
```

## Test Coverage

### Unit Tests (30+ test cases)
- ✅ Health check endpoint
- ✅ Player registration API
- ✅ Event tracking API
- ✅ Database connection testing
- ✅ Error handling
- ✅ CORS configuration
- ✅ Request validation
- ✅ Performance benchmarks

### Integration Tests (25+ test cases)
- ✅ Database connectivity
- ✅ CRUD operations
- ✅ Transaction management
- ✅ Connection pooling
- ✅ Data integrity
- ✅ Concurrent operations
- ✅ Performance under load

### Load Tests
- ✅ Baseline performance (1,000 concurrent users)
- ✅ Normal traffic (5,000 concurrent users)
- ✅ Game day peak (50,000 concurrent users)
- ✅ Viral spike (25,000 instant surge)
- ✅ Soak test (4-hour stability)

## Performance Targets

| Metric | Baseline | Normal | Peak |
|--------|----------|--------|------|
| **Concurrent Users** | 1,000 | 5,000 | 50,000 |
| **Requests/sec** | 1,500 | 3,000 | 15,000 |
| **p95 Response Time** | < 300ms | < 300ms | < 500ms |
| **p99 Response Time** | < 500ms | < 500ms | < 1000ms |
| **Error Rate** | < 1% | < 1% | < 1% |

## Test Scenarios

### User Flows
1. **Primary Flow (60%)**: View game → Submit answers → Complete
2. **Quick Bounce (20%)**: View game → Exit
3. **Power User (15%)**: Complete → Share → Replay
4. **Registration (5%)**: Register → Play → Check leaderboard

### Traffic Patterns
- **Baseline**: Constant low load
- **Normal**: Typical weekday traffic
- **Peak**: Sunday game day surge
- **Spike**: Viral social media burst
- **Soak**: Extended duration stability

## Environment Variables

Required for different test types:

```bash
# Required for integration tests
DATABASE_URL=postgresql://user:pass@host:port/db
RUN_INTEGRATION_TESTS=true

# Optional for load tests
TARGET_URL=https://your-app.com  # Defaults to production URL
```

## Interpreting Results

### Unit Test Output
```
PASS tests/unit/api.unit.test.js
  ✓ GET / returns 200 (15ms)
  ✓ POST /api/track accepts events (23ms)
  ...
Tests: 30 passed, 30 total
Coverage: 82.5%
```

### Load Test Output
```
Summary:
  Scenarios launched: 10000
  Requests completed: 50000
  Response time (p95): 245ms
  Response time (p99): 412ms
  Errors: 0.1%
  RPS: 1543
```

### Success Criteria
- ✅ All unit tests pass
- ✅ Integration tests pass with live DB
- ✅ p95 < target response time
- ✅ Error rate < 1%
- ✅ No memory leaks in soak test

## Troubleshooting

### Common Issues

**"Cannot find module" errors**
```bash
npm install
```

**Database connection errors**
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
npm run test -- api/db-test
```

**Artillery not found**
```bash
npm install artillery
# or
npx artillery --version
```

**Load test connection refused**
- Verify target URL is accessible
- Check firewall settings
- Ensure app is running
- Start with baseline test

**Out of memory**
```bash
NODE_OPTIONS=--max-old-space-size=4096 npm test
```

## Best Practices

### Before Load Testing
1. ✅ Notify stakeholders
2. ✅ Verify infrastructure capacity
3. ✅ Set up monitoring (APM, logs)
4. ✅ Have rollback plan
5. ✅ Start with baseline test

### During Testing
1. ✅ Monitor metrics continuously
2. ✅ Document observations
3. ✅ Be ready to abort if needed
4. ✅ Capture logs and traces

### After Testing
1. ✅ Analyze all reports
2. ✅ Compare to baseline
3. ✅ Document findings
4. ✅ Create optimization tasks
5. ✅ Share results with team

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Additional Resources

- **Detailed Strategy**: See `/TESTING_STRATEGY.md`
- **Execution Guide**: See `/TEST_EXECUTION_GUIDE.md`
- **Artillery Docs**: https://www.artillery.io/docs
- **Jest Docs**: https://jestjs.io/docs

## Support

For questions or issues:
1. Check the TEST_EXECUTION_GUIDE.md
2. Review Artillery reports in test-reports/
3. Check application logs
4. Consult with the development team

## License

Part of the NFL Teammates Game project.
