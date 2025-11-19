# Test Execution Guide - NFL Teammates Game

## Overview

This guide provides step-by-step instructions for executing all test suites for the NFL Teammates Game, including unit tests, integration tests, and load tests that simulate NFL.com-like traffic.

## Prerequisites

### Required Software
- Node.js 18.x or higher
- npm or yarn
- PostgreSQL (for integration tests)
- Git

### Environment Setup

1. **Install Dependencies**
```bash
cd nfl-teamates-game/backend
npm install
```

2. **Environment Variables**
Create a `.env` file in the backend directory:
```bash
DATABASE_URL=your_postgresql_connection_string
PORT=8080
RUN_INTEGRATION_TESTS=true  # Set to 'true' to run integration tests
```

3. **Verify Installation**
```bash
npm test -- --version  # Verify Jest is installed
npx artillery --version  # Verify Artillery is installed
```

## Running Tests

### 1. Unit Tests

Unit tests validate individual functions and API endpoints without requiring a database connection.

**Run all unit tests:**
```bash
npm run test:unit
```

**Run with coverage:**
```bash
npm test
```

**Run in watch mode (for development):**
```bash
npm run test:watch
```

**Expected output:**
- 30+ test cases should pass
- Code coverage should be > 70%
- All tests should complete in < 10 seconds

**Key test files:**
- `tests/unit/api.unit.test.js` - API endpoint tests

### 2. Integration Tests

Integration tests validate database operations and require a live PostgreSQL connection.

**Prerequisites:**
- PostgreSQL database must be running
- `DATABASE_URL` environment variable must be set
- `RUN_INTEGRATION_TESTS=true` must be set in `.env`

**Run integration tests:**
```bash
npm run test:integration
```

**Expected output:**
- Database connection should succeed
- All CRUD operations should work
- Transaction tests should pass
- Tests should complete in < 30 seconds

**Key test files:**
- `tests/integration/database.integration.test.js` - Database operations

**Note:** Integration tests automatically clean up test data after execution.

### 3. Load Tests

Load tests simulate various traffic patterns similar to NFL.com.

#### 3.1 Baseline Load Test

Tests basic performance with minimal load (1,000 concurrent users).

**Run:**
```bash
npm run load:baseline
```

**Duration:** ~35 minutes (5 min ramp-up + 30 min sustained)

**Expected Results:**
- p95 response time: < 300ms
- p99 response time: < 500ms
- Error rate: < 1%
- Throughput: ~1,500 req/sec

#### 3.2 Normal Traffic Load Test

Simulates typical weekday traffic (5,000 concurrent users).

**Run:**
```bash
npm run load:normal
```

**Duration:** ~35 minutes

**Expected Results:**
- p95 response time: < 300ms
- p99 response time: < 500ms
- Error rate: < 1%
- Throughput: ~3,000 req/sec

#### 3.3 Game Day Peak Load Test

Simulates Sunday game day traffic (50,000 concurrent users).

**Run:**
```bash
npm run load:peak
```

**Duration:** ~60 minutes (10 min ramp-up + 45 min sustained + 5 min cool-down)

**Expected Results:**
- p95 response time: < 500ms
- p99 response time: < 1000ms
- Error rate: < 1%
- Throughput: ~15,000 req/sec

**Warning:** This test generates significant load. Only run against production-ready infrastructure.

#### 3.4 Viral Spike Load Test

Simulates sudden traffic surge from social media (25,000 instant users).

**Run:**
```bash
npm run load:spike
```

**Duration:** ~15 minutes

**Expected Results:**
- System should remain stable
- Error rate: < 2% (acceptable during spike)
- p95 response time: < 1000ms
- Recovery should be graceful

#### 3.5 Soak Test

Long-duration stability test (10,000 concurrent users for 4 hours).

**Run:**
```bash
npm run load:soak
```

**Duration:** ~4 hours 20 minutes

**Purpose:** Detect memory leaks, connection pool issues, and resource exhaustion

**Expected Results:**
- No performance degradation over time
- Stable memory usage
- Error rate: < 0.5%
- Consistent response times

**Best Practice:** Run overnight or during off-peak hours.

#### 3.6 Run All Load Tests

**Sequential execution:**
```bash
npm run load:all
```

This runs baseline, normal, and peak tests in sequence.

**Duration:** ~2 hours 10 minutes

## 4. Performance Monitoring

Real-time performance monitoring script for production environments.

**Run default monitoring (1 minute):**
```bash
node tests/performance-monitor.js
```

**Custom monitoring:**
```bash
# Monitor for 5 minutes with 10-second intervals
node tests/performance-monitor.js --duration 300000 --interval 10000

# Monitor custom URL
node tests/performance-monitor.js --url https://your-app.com --duration 60000
```

**Output:**
- Real-time health checks
- Response time percentiles (p50, p75, p90, p95, p99)
- Success/error rates by endpoint
- JSON report saved to `performance-report-*.json`

**Use cases:**
- Pre-deployment validation
- Production health monitoring
- Performance regression detection
- Capacity planning

## Test Scenarios Explained

### User Flow Scenarios

**1. Primary User Flow (60% of users)**
- Land on homepage
- View game interface (2-5 seconds)
- Submit 1-4 answer attempts
- View results
- 30% share on social media

**2. Quick Bounce (20% of users)**
- Land on homepage
- View briefly (1-3 seconds)
- Exit immediately

**3. Power User (15% of users)**
- Complete game quickly
- Share on multiple platforms
- Play again 2-3 times

**4. Database Registration (5% of users)**
- Register name/email
- Complete game
- Check leaderboard

### Load Patterns

**Baseline:** Constant low load to establish performance baseline

**Normal:** Typical weekday traffic with gradual ramp-up

**Peak:** Game day traffic with high sustained load

**Spike:** Sudden viral traffic surge (e.g., celebrity tweet)

**Soak:** Extended duration to find resource leaks

## Interpreting Results

### Artillery Reports

After each load test, Artillery generates a detailed report:

**Key Metrics:**
- **http.request_rate**: Requests per second
- **http.response_time**: Response time percentiles
- **http.responses**: Status code distribution
- **errors**: Error count and types

**Success Criteria:**
```
✅ http.response_time.p95 < 300ms (baseline/normal)
✅ http.response_time.p95 < 500ms (peak)
✅ errors.rate < 1%
✅ http.codes.200 > 99%
```

### Common Issues

**High Response Times:**
- Check database connection pool size
- Verify network latency
- Review slow queries
- Consider caching

**High Error Rates:**
- Check server logs for exceptions
- Verify database availability
- Check rate limiting
- Review resource limits (CPU, memory)

**Memory Leaks (Soak Test):**
- Monitor memory usage over time
- Check for unclosed database connections
- Review event listener cleanup
- Profile with Node.js heap snapshots

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd nfl-teamates-game/backend
          npm install
      - name: Run unit tests
        run: |
          cd nfl-teamates-game/backend
          npm run test:unit
      - name: Run integration tests
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          RUN_INTEGRATION_TESTS: true
        run: |
          cd nfl-teamates-game/backend
          npm run test:integration
```

## Troubleshooting

### Tests Fail to Start

**Issue:** Cannot find module errors
**Solution:**
```bash
cd nfl-teamates-game/backend
npm install
```

### Database Connection Errors

**Issue:** Integration tests fail with connection errors
**Solution:**
1. Verify `DATABASE_URL` is set correctly
2. Check PostgreSQL is running
3. Verify SSL settings
4. Test connection: `npm run test -- api/db-test`

### Artillery Errors

**Issue:** Artillery command not found
**Solution:**
```bash
npm install -g artillery@latest
# Or use npx
npx artillery --version
```

**Issue:** Connection refused errors during load tests
**Solution:**
1. Verify target URL is accessible
2. Check firewall settings
3. Verify application is running
4. Start with smaller load (baseline test)

### Out of Memory Errors

**Issue:** Node runs out of memory during tests
**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm test
```

## Best Practices

### Before Running Load Tests

1. **Notify stakeholders** - Load tests can impact production
2. **Verify infrastructure** - Ensure adequate resources
3. **Set up monitoring** - Watch CPU, memory, database
4. **Have rollback plan** - In case of issues
5. **Start small** - Begin with baseline, scale up

### During Load Tests

1. **Monitor continuously** - Watch metrics in real-time
2. **Document observations** - Note any anomalies
3. **Be ready to stop** - If errors spike or system degrades
4. **Capture logs** - For post-test analysis

### After Load Tests

1. **Analyze reports** - Review all metrics
2. **Compare to baseline** - Identify regressions
3. **Document findings** - Create action items
4. **Share results** - With team and stakeholders
5. **Optimize** - Address bottlenecks found

## Performance Optimization Checklist

Based on test results, consider these optimizations:

- [ ] Enable HTTP/2
- [ ] Implement response caching
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Configure connection pooling
- [ ] Enable gzip compression
- [ ] Use CDN for static assets
- [ ] Implement rate limiting
- [ ] Add auto-scaling
- [ ] Optimize Docker images
- [ ] Enable database query caching
- [ ] Review N+1 query patterns
- [ ] Implement Redis caching
- [ ] Optimize JSON serialization

## Next Steps

After running all tests:

1. **Review TESTING_STRATEGY.md** for detailed methodology
2. **Check performance reports** in `tests/` directory
3. **Implement optimizations** based on findings
4. **Re-run tests** to validate improvements
5. **Set up continuous monitoring** for production
6. **Schedule regular load tests** (monthly recommended)

## Support and Resources

- **Documentation:** See TESTING_STRATEGY.md
- **Artillery Docs:** https://www.artillery.io/docs
- **Jest Docs:** https://jestjs.io/docs/getting-started
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

## Summary

This testing suite provides comprehensive coverage:
- ✅ **Unit Tests:** Fast, isolated component testing
- ✅ **Integration Tests:** Database and API validation
- ✅ **Load Tests:** NFL.com-scale traffic simulation
- ✅ **Monitoring:** Real-time performance tracking

**Estimated Total Testing Time:**
- Unit + Integration: ~1 minute
- All Load Tests: ~6 hours (including soak test)
- Performance Monitoring: 1-5 minutes

For questions or issues, please refer to the testing strategy document or consult with the development team.
