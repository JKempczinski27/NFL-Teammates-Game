# Backend Testing Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 📋 Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests sequentially |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode (auto-rerun on changes) |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:security` | Run security tests only |
| `npm run test:load` | Run load/stress tests only |

## 📁 Test Structure

```
backend/tests/
├── setup.js                          # Global test setup
├── README.md                         # Comprehensive documentation
│
├── helpers/                          # Test utilities
│   ├── dbHelper.js                  # Database management
│   ├── testData.js                  # Test data generators
│   └── serverHelper.js              # Server lifecycle
│
├── unit/                            # Unit tests (50+ tests)
│   └── api.endpoints.test.js       # API endpoint tests
│
├── integration/                     # Integration tests (100+ tests)
│   ├── database.test.js            # All 6 tables tested
│   └── data-integrity.test.js      # Constraints & relationships
│
├── security/                        # Security tests (50+ tests)
│   └── sql-injection.test.js       # SQL, XSS, injection tests
│
└── load/                            # Load tests (20+ tests)
    └── stress.test.js              # Concurrent & stress tests
```

## ✅ What's Tested

### API Endpoints (5/5)
- ✅ `GET /` - Health check
- ✅ `GET /api/db-test` - Database connection
- ✅ `POST /api/player` - Save player
- ✅ `GET /api/track` - Track status
- ✅ `POST /api/track` - Track events

### Database Tables (6/6)
- ✅ Teams (32 NFL teams)
- ✅ Players (with CRUD operations)
- ✅ Team Relationships (foreign keys, cascades)
- ✅ Questions (difficulty validation)
- ✅ Question Players (many-to-many)
- ✅ User Stats (session tracking)

### Security (50+ attack vectors)
- ✅ SQL Injection (10+ payloads)
- ✅ XSS Attacks (6+ payloads)
- ✅ Input Validation (15+ edge cases)
- ✅ Header Injection
- ✅ Path Traversal
- ✅ Command Injection
- ✅ NoSQL Injection
- ✅ DoS Prevention

### Load Testing (15+ scenarios)
- ✅ Concurrent requests (up to 200)
- ✅ Database connection pool stress
- ✅ Bulk operations (500+ records)
- ✅ Sustained load (10 req/sec)
- ✅ Performance benchmarks

## 🎯 Coverage Goals

Target: **> 80% coverage**

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## 🔧 Configuration

### Environment Variables
Create `.env` file with:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
PORT=8080
NODE_ENV=test
```

### Jest Config
Located in `jest.config.js`:
- Timeout: 30 seconds
- Environment: Node.js
- Run mode: Sequential

## 📊 Expected Results

When all tests pass, you'll see:
```
Test Suites: 6 passed, 6 total
Tests:       150+ passed, 150+ total
Time:        ~30-60 seconds
```

## 🐛 Debugging

### Enable console output
Edit `tests/setup.js`:
```javascript
// Comment out these lines to see console.log
// global.console = {
//   ...console,
//   log: jest.fn(),
// };
```

### Run single test file
```bash
npx jest tests/unit/api.endpoints.test.js
```

### Run specific test
```bash
npx jest --testNamePattern="should handle SQL injection"
```

### Verbose output
```bash
npm test -- --verbose
```

## ⚡ Performance Benchmarks

Expected performance:
- Health check: < 50ms
- Database query: < 100ms
- Player insert: < 500ms
- 50 concurrent requests: < 5 seconds
- 100 concurrent requests: < 30 seconds

## 🛡️ Security Test Coverage

All OWASP Top 10 attack vectors tested:
- ✅ Injection
- ✅ Broken Authentication (input validation)
- ✅ Sensitive Data Exposure
- ✅ XML External Entities (XSS)
- ✅ Broken Access Control
- ✅ Security Misconfiguration
- ✅ Cross-Site Scripting (XSS)
- ✅ Insecure Deserialization
- ✅ Using Components with Known Vulnerabilities
- ✅ Insufficient Logging & Monitoring

## 📈 CI/CD Integration

Add to your GitHub Actions:
```yaml
- name: Run Backend Tests
  run: |
    cd backend
    npm install
    npm test
    npm run test:coverage
```

## 🔍 Test Details

### Unit Tests
- **Focus**: Individual endpoints
- **Speed**: Fast (< 5 seconds)
- **Isolation**: Mocked/minimal database

### Integration Tests
- **Focus**: Database operations
- **Speed**: Medium (10-20 seconds)
- **Isolation**: Real database, cleaned between tests

### Security Tests
- **Focus**: Attack prevention
- **Speed**: Medium (10-15 seconds)
- **Isolation**: Real database with attack payloads

### Load Tests
- **Focus**: Performance under stress
- **Speed**: Slow (30-60 seconds)
- **Isolation**: Real database with bulk data

## 💡 Tips

1. **Run unit tests first** - They're fastest and catch basic issues
2. **Run load tests last** - They're slowest
3. **Use watch mode during development** - Auto-reruns on file changes
4. **Check coverage regularly** - Ensures comprehensive testing
5. **Review failed test output carefully** - Jest provides detailed error messages

## 🚨 Common Issues

### "Database connection failed"
- Check `.env` file exists with correct `DATABASE_URL`
- Verify database is accessible
- Check SSL settings

### "Tests timeout"
- Increase timeout in `jest.config.js` or individual test
- Check database performance
- Verify network connectivity

### "Port already in use"
- Change `TEST_PORT` in `.env`
- Kill existing server: `lsof -ti:8081 | xargs kill`

### "Permission denied"
- Check database user permissions
- Verify table access rights

## 📚 Further Reading

- **Full Documentation**: See `tests/README.md`
- **Jest Docs**: https://jestjs.io/
- **Supertest Docs**: https://github.com/visionmedia/supertest
- **Database Schema**: See `schema.sql` and `DATABASE.md`

---

**Need Help?** Check `tests/README.md` for comprehensive documentation.
