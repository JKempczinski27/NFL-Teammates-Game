# Horizontal Scaling Guide

This document explains how to scale the NFL Games Hub backend to handle increased load by adding more server instances.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Scaling Strategies](#scaling-strategies)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment Options](#deployment-options)
- [Monitoring](#monitoring)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

---

## Overview

The NFL Games Hub backend is designed for horizontal scaling, allowing you to handle thousands of concurrent users by adding more server instances. Key features:

- **Stateless Backend**: No session data stored on servers
- **Redis Caching**: Shared cache across all instances
- **Connection Pooling**: Optimized database connections
- **Rate Limiting**: Distributed rate limiting via Redis
- **Health Checks**: Load balancer-friendly health endpoints
- **Metrics**: Real-time performance monitoring

## Architecture

### Horizontal Scaling Architecture

```
┌──────────────┐
│ Load Balancer│  (NGINX, AWS ALB, etc.)
│   (Port 80)  │
└──────┬───────┘
       │
    ┌──┴──────────────────────┐
    │                         │
┌───▼────┐  ┌────────┐  ┌────▼────┐
│Backend1│  │Backend2│  │Backend3 │  ... (scale to N instances)
│(Node.js│  │(Node.js│  │(Node.js)│
└───┬────┘  └───┬────┘  └────┬────┘
    │           │            │
    └───────────┼────────────┘
                │
       ┌────────┴─────────┐
       │                  │
   ┌───▼────┐      ┌──────▼─────┐
   │ Redis  │      │ PostgreSQL │
   │ Cache  │      │  Database  │
   └────────┘      └────────────┘
```

### Components

1. **Load Balancer**: Distributes incoming requests across backend instances
2. **Backend Instances**: Stateless Node.js servers (can scale to hundreds)
3. **Redis**: Shared cache and rate limiting store
4. **PostgreSQL**: Centralized database (consider read replicas for even more scale)

---

## Scaling Strategies

### 1. Vertical Scaling (Single Instance)

**When to use**: < 100 concurrent users

```bash
# Use Node.js clustering to utilize all CPU cores
export ENABLE_CLUSTERING=true
export CLUSTER_WORKERS=4  # Or leave blank to use all cores
npm start
```

**Resource Requirements**:
- CPU: 2 cores
- RAM: 512MB
- Expected Load: ~100 concurrent users

### 2. Horizontal Scaling (Multiple Instances)

**When to use**: > 100 concurrent users

Deploy multiple backend instances behind a load balancer.

**Resource Requirements per Instance**:
- CPU: 2 cores
- RAM: 512MB-1GB
- Expected Load per Instance: ~100-200 concurrent users

**Total Capacity**: N instances × 150 users ≈ **150N concurrent users**

### 3. Hybrid Scaling (Clustered + Horizontal)

**When to use**: > 1000 concurrent users

Combine clustering within each instance with multiple instances.

```bash
# On each instance
export ENABLE_CLUSTERING=true
export CLUSTER_WORKERS=2  # 2 workers per instance
```

**Resource Requirements per Instance**:
- CPU: 4 cores
- RAM: 1-2GB
- Expected Load per Instance: ~200-400 concurrent users

---

## Quick Start

### Option 1: Docker Compose (Recommended)

The easiest way to test horizontal scaling locally:

```bash
# 1. Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# 2. Start all services (3 backend instances + Redis + Postgres + NGINX)
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f backend1

# 5. Access the API
curl http://localhost/health
```

**What this gives you**:
- 3 backend instances
- NGINX load balancer
- Redis cache
- PostgreSQL database
- Ready for ~450 concurrent users

### Option 2: Manual Setup

For production deployments:

```bash
# 1. Install and configure Redis
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# 2. Start multiple backend instances
# Instance 1
PORT=3001 npm start &

# Instance 2
PORT=3002 npm start &

# Instance 3
PORT=3003 npm start &

# 3. Configure NGINX (see nginx.conf)
sudo cp backend/nginx.conf /etc/nginx/sites-available/nfl-games
sudo ln -s /etc/nginx/sites-available/nfl-games /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Configuration

### Environment Variables

#### Required for Scaling

```bash
# Redis (required for distributed caching and rate limiting)
REDIS_URL=redis://localhost:6379

# Database (optimize pool size for multiple instances)
DATABASE_URL=postgresql://user:pass@host:5432/db
DB_POOL_MAX=10          # Lower per instance when scaling horizontally
DB_POOL_MIN=2
DB_STATEMENT_TIMEOUT=10000
DB_QUERY_TIMEOUT=10000

# Clustering (optional, for vertical scaling)
ENABLE_CLUSTERING=false  # true for single-instance vertical scaling
CLUSTER_WORKERS=4        # Number of worker processes

# CORS (add your frontend URLs)
FRONTEND_URL=https://yourgame.com,https://www.yourgame.com
```

#### Scaling Rules of Thumb

| Instances | DB_POOL_MAX per Instance | Total DB Connections |
|-----------|-------------------------|---------------------|
| 1         | 20                      | 20                  |
| 3         | 10                      | 30                  |
| 5         | 8                       | 40                  |
| 10        | 5                       | 50                  |

**Important**: PostgreSQL has a maximum connection limit (default 100). Ensure `Total DB Connections < PostgreSQL max_connections - 20`.

### Backend Package Dependencies

Install the required scaling dependencies:

```bash
cd backend
npm install redis rate-limit-redis express-rate-limit
```

---

## Deployment Options

### 1. AWS (Elastic Beanstalk + ALB)

**Architecture**: Application Load Balancer → Multiple EC2 instances → RDS + ElastiCache

```bash
# 1. Create Elastic Beanstalk application
eb init nfl-games-backend

# 2. Configure auto-scaling
# Edit .ebextensions/autoscaling.config
Resources:
  AWSEBAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: 3
      MaxSize: 10

# 3. Set environment variables
eb setenv REDIS_URL=redis://your-elasticache.amazonaws.com:6379
eb setenv DATABASE_URL=postgresql://...

# 4. Deploy
eb deploy
```

**Cost Estimate** (us-east-1):
- 3× t3.small instances: ~$45/month
- ALB: ~$20/month
- ElastiCache (cache.t3.micro): ~$12/month
- **Total**: ~$77/month for ~450 concurrent users

### 2. Railway / Render

**Simple auto-scaling for small-medium apps**:

```bash
# Railway
railway up
railway variables set REDIS_URL=...

# Render
# In dashboard, set:
# - Instances: 3
# - Instance type: Starter
# - Add Redis addon
```

**Cost Estimate**:
- 3× Starter instances: ~$21/month
- Redis addon: ~$10/month
- **Total**: ~$31/month for ~450 concurrent users

### 3. DigitalOcean (Kubernetes)

**For high-scale deployments**:

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nfl-games-backend
spec:
  replicas: 5  # Scale up/down as needed
  selector:
    matchLabels:
      app: nfl-games-backend
  template:
    metadata:
      labels:
        app: nfl-games-backend
    spec:
      containers:
      - name: backend
        image: your-registry/nfl-games-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: nfl-games-backend
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3001
  selector:
    app: nfl-games-backend
```

```bash
kubectl apply -f k8s/deployment.yaml
kubectl scale deployment nfl-games-backend --replicas=10
```

### 4. Vercel / Netlify (Serverless)

**Note**: The backend is not currently optimized for serverless, but can be adapted:

- Each request spawns a new instance (cold starts)
- No Redis support (use Upstash Redis)
- Database connection pooling needs adjustment

---

## Monitoring

### Health Checks

Three health check endpoints are available:

```bash
# Basic health check (for load balancers)
curl http://localhost:3001/health
# Returns: {"status":"healthy","timestamp":"...","uptime":123,"pid":1234}

# Detailed health check (database, Redis, memory)
curl http://localhost:3001/health/detailed
# Returns comprehensive system status

# Metrics endpoint (for monitoring systems)
curl http://localhost:3001/metrics
# Returns process, database pool, and cache metrics
```

### Load Balancer Configuration

**NGINX**: Already configured in `nginx.conf`
- Passive health checks via `max_fails` and `fail_timeout`
- Active health checks require NGINX Plus

**AWS Application Load Balancer**:
```
Health Check Path: /health
Healthy Threshold: 2
Unhealthy Threshold: 3
Timeout: 5 seconds
Interval: 30 seconds
Success Codes: 200
```

**Google Cloud Load Balancer**:
```gcloud
gcloud compute health-checks create http nfl-games-health \
  --port=3001 \
  --request-path=/health \
  --check-interval=30s \
  --timeout=5s \
  --unhealthy-threshold=3 \
  --healthy-threshold=2
```

### Monitoring Tools

#### Prometheus + Grafana

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'nfl-games-backend'
    static_configs:
      - targets:
        - 'backend1:3001'
        - 'backend2:3001'
        - 'backend3:3001'
    metrics_path: '/metrics'
    scrape_interval: 15s
```

#### Datadog

```bash
# Install Datadog agent on each instance
DD_API_KEY=your-key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Monitor the /metrics endpoint
# Add to datadog.yaml:
logs_enabled: true
```

#### New Relic

```bash
npm install newrelic
```

```javascript
// Add to top of server.js
require('newrelic');
```

---

## Performance Optimization

### Database Optimization

1. **Read Replicas**: For read-heavy workloads

```javascript
const readPool = new Pool({
  connectionString: process.env.DATABASE_READ_URL,
  // ... config
});

// Use readPool for SELECT queries
app.get('/api/players', async (req, res) => {
  const result = await readPool.query('SELECT * FROM players');
  // ...
});
```

2. **Connection Pooling Tuning**:

```bash
# For 10 backend instances with 5 connections each = 50 total
# PostgreSQL max_connections should be at least 70 (50 + 20 buffer)

# Check current max_connections
psql -c "SHOW max_connections;"

# Increase if needed (requires restart)
# In postgresql.conf:
max_connections = 100
```

3. **Query Optimization**:

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_user_stats_session ON user_stats(session_id);
```

### Caching Strategy

#### Cache TTLs (Time To Live)

| Endpoint | TTL | Reasoning |
|----------|-----|-----------|
| `/api/teams` | 3600s (1h) | Teams rarely change |
| `/api/players/:id` | 180s (3m) | Player data is mostly static |
| `/api/players` | 120s (2m) | List changes as players are added |
| `/api/stats/:id` | 60s (1m) | Stats update frequently |
| `/api/questions/random` | No cache | Must be random |

#### Cache Invalidation

```javascript
// After creating a new player
await cache.invalidateCache('cache:*/api/players*');

// After updating stats
await cache.del(`cache:/api/stats/${sessionId}`);
```

### Rate Limiting Tuning

Current limits (adjustable in `rateLimiter.js`):

| Limiter | Window | Max Requests |
|---------|--------|--------------|
| `readLimiter` | 1 minute | 100 |
| `writeLimiter` | 1 minute | 30 |
| `apiLimiter` | 1 minute | 60 |
| `sessionLimiter` | 5 minutes | 50 |

**Adjust for your needs**:

```javascript
// In rateLimiter.js, change:
const apiLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 120,  // Increase from 60 to 120
  // ...
});
```

---

## Troubleshooting

### Issue: Redis Connection Errors

**Symptoms**:
```
⚠️ Redis unavailable - running without cache: connect ECONNREFUSED
```

**Solution**:
1. Ensure Redis is running: `redis-cli ping` should return `PONG`
2. Check `REDIS_URL` environment variable
3. Verify firewall rules allow Redis port (6379)
4. The application will work without Redis, but without caching/distributed rate limiting

### Issue: Database Connection Pool Exhausted

**Symptoms**:
```
Error: remaining connection slots are reserved for non-replication superuser connections
```

**Solution**:
1. Reduce `DB_POOL_MAX` per instance
2. Increase PostgreSQL `max_connections`
3. Scale horizontally with more instances instead of larger pools

### Issue: High Memory Usage

**Symptoms**: Node.js processes consuming > 2GB RAM

**Solution**:
1. Enable clustering to spread load: `ENABLE_CLUSTERING=true`
2. Reduce database pool size: `DB_POOL_MAX=5`
3. Check for memory leaks: `node --inspect server.js`
4. Add Redis memory limits: `redis-cli CONFIG SET maxmemory 256mb`

### Issue: Uneven Load Distribution

**Symptoms**: One backend instance gets most traffic

**Solution**:
1. Check load balancer algorithm (use `least_conn` or `ip_hash`)
2. Verify all backend instances are healthy
3. Ensure sticky sessions are disabled (unless required)
4. Check DNS round-robin if using multiple load balancers

### Issue: Rate Limiting Not Working Across Instances

**Symptoms**: Users can exceed rate limits by hitting different backend instances

**Solution**:
1. Ensure Redis is configured: `REDIS_URL=redis://...`
2. Verify all instances can connect to Redis
3. Check Redis logs: `redis-cli MONITOR`
4. Confirm `rate-limit-redis` package is installed

---

## Capacity Planning

### Estimated Capacity

| Configuration | Concurrent Users | Cost/Month |
|--------------|-----------------|------------|
| 1 instance (no clustering) | ~100 | $15-20 |
| 1 instance (with clustering, 4 cores) | ~200 | $30-40 |
| 3 instances | ~450 | $50-80 |
| 5 instances | ~750 | $80-120 |
| 10 instances | ~1,500 | $150-250 |
| 20 instances | ~3,000 | $300-500 |

**Assumptions**:
- Average request duration: 50ms
- 10 requests per user per minute
- Connection keep-alive enabled
- Proper caching in place

### Stress Testing

Use tools like Apache Bench, Artillery, or k6 to test your setup:

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 1000 http://localhost/api/players
```

```javascript
// artillery-config.yml
config:
  target: 'http://localhost'
  phases:
    - duration: 60
      arrivalRate: 10
      rampTo: 50

scenarios:
  - name: "Load test"
    flow:
      - get:
          url: "/api/players"
      - get:
          url: "/api/teams"
```

```bash
artillery run artillery-config.yml
```

---

## Additional Resources

- [Node.js Clustering Documentation](https://nodejs.org/api/cluster.html)
- [Redis Best Practices](https://redis.io/docs/reference/optimization/best-practices/)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [NGINX Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)
- [AWS Auto Scaling](https://docs.aws.amazon.com/autoscaling/)

---

## Summary

With horizontal scaling enabled, the NFL Games Hub backend can handle:

- **Small**: 100-500 users (1-3 instances)
- **Medium**: 500-2,000 users (3-10 instances)
- **Large**: 2,000-10,000 users (10-50 instances)
- **Enterprise**: 10,000+ users (50+ instances + read replicas)

The key is to:
1. ✅ Use Redis for distributed caching and rate limiting
2. ✅ Configure proper database connection pooling
3. ✅ Deploy behind a load balancer
4. ✅ Monitor health and metrics
5. ✅ Scale horizontally by adding more instances

For questions or issues, refer to the troubleshooting section or open a GitHub issue.
