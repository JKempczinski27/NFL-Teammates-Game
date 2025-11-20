#!/usr/bin/env node

/**
 * Super Bowl Load Testing Real-Time Monitor
 * Advanced monitoring for extreme traffic scenarios
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SuperBowlMonitor {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://nfl-teammates-game-production.up.railway.app';
    this.interval = config.interval || 2000; // 2 seconds for Super Bowl
    this.duration = config.duration || 300000; // 5 minutes default
    this.metrics = [];
    this.startTime = Date.now();
    this.alerts = [];
    this.concurrentRequests = config.concurrentRequests || 50; // Simulate concurrent load
  }

  async checkEndpointConcurrently(endpoint, method = 'GET', data = null, count = 10) {
    const promises = Array(count).fill(null).map(() =>
      this.checkEndpoint(endpoint, method, data)
    );
    return Promise.all(promises);
  }

  async checkEndpoint(endpoint, method = 'GET', data = null) {
    const start = Date.now();
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        timeout: 30000, // 30 second timeout for high load
      };

      if (data) {
        config.data = data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);
      const duration = Date.now() - start;

      return {
        endpoint,
        method,
        status: response.status,
        duration,
        success: true,
        timestamp: new Date().toISOString(),
        size: JSON.stringify(response.data).length,
      };
    } catch (error) {
      const duration = Date.now() - start;
      return {
        endpoint,
        method,
        status: error.response?.status || 0,
        duration,
        success: false,
        error: error.message,
        errorType: this.categorizeError(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  categorizeError(error) {
    if (error.code === 'ECONNABORTED') return 'TIMEOUT';
    if (error.code === 'ECONNREFUSED') return 'CONNECTION_REFUSED';
    if (error.code === 'ETIMEDOUT') return 'NETWORK_TIMEOUT';
    if (error.response?.status === 429) return 'RATE_LIMITED';
    if (error.response?.status === 503) return 'SERVICE_UNAVAILABLE';
    if (error.response?.status >= 500) return 'SERVER_ERROR';
    if (error.response?.status >= 400) return 'CLIENT_ERROR';
    return 'UNKNOWN';
  }

  async runChecks() {
    const timestamp = Date.now();

    // Run concurrent checks to simulate real Super Bowl load
    const checks = await Promise.all([
      // Homepage - highest traffic
      this.checkEndpointConcurrently('/', 'GET', null, 20),

      // Tracking endpoint - most frequent
      this.checkEndpointConcurrently('/api/track', 'POST', {
        eventType: 'superbowl_halftime_test',
        sessionId: `monitor-${timestamp}`,
        timestamp: timestamp,
        eventData: {
          device: 'mobile',
          context: 'halftime'
        }
      }, 20),

      // Database health
      this.checkEndpointConcurrently('/api/db-test', 'GET', null, 5),

      // Track GET endpoint
      this.checkEndpointConcurrently('/api/track', 'GET', null, 5),
    ]);

    return checks.flat();
  }

  analyzeResults(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    const analysis = {
      timestamp: new Date().toISOString(),
      totalRequests: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / results.length) * 100,
      errorRate: (failed.length / results.length) * 100,
    };

    if (successful.length > 0) {
      const durations = successful.map(r => r.duration).sort((a, b) => a - b);
      analysis.responseTime = {
        min: Math.min(...durations),
        max: Math.max(...durations),
        mean: durations.reduce((a, b) => a + b, 0) / durations.length,
        p50: durations[Math.floor(durations.length * 0.5)],
        p75: durations[Math.floor(durations.length * 0.75)],
        p90: durations[Math.floor(durations.length * 0.9)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)],
      };
    }

    // Error breakdown
    if (failed.length > 0) {
      const errorTypes = {};
      failed.forEach(f => {
        const type = f.errorType || 'UNKNOWN';
        errorTypes[type] = (errorTypes[type] || 0) + 1;
      });
      analysis.errorBreakdown = errorTypes;
    }

    return analysis;
  }

  checkAlerts(analysis) {
    const alerts = [];
    const now = new Date().toISOString();

    // Critical alerts
    if (analysis.errorRate > 10) {
      alerts.push({
        level: 'CRITICAL',
        message: `Error rate is ${analysis.errorRate.toFixed(2)}% (threshold: 10%)`,
        timestamp: now,
      });
    }

    if (analysis.responseTime?.p95 > 2000) {
      alerts.push({
        level: 'CRITICAL',
        message: `p95 response time is ${analysis.responseTime.p95.toFixed(0)}ms (threshold: 2000ms)`,
        timestamp: now,
      });
    }

    // Warning alerts
    if (analysis.errorRate > 5 && analysis.errorRate <= 10) {
      alerts.push({
        level: 'WARNING',
        message: `Error rate is ${analysis.errorRate.toFixed(2)}% (warning threshold: 5%)`,
        timestamp: now,
      });
    }

    if (analysis.responseTime?.p95 > 1000 && analysis.responseTime?.p95 <= 2000) {
      alerts.push({
        level: 'WARNING',
        message: `p95 response time is ${analysis.responseTime.p95.toFixed(0)}ms (warning threshold: 1000ms)`,
        timestamp: now,
      });
    }

    // Specific error type alerts
    if (analysis.errorBreakdown?.TIMEOUT > 0) {
      alerts.push({
        level: 'WARNING',
        message: `${analysis.errorBreakdown.TIMEOUT} timeout errors detected`,
        timestamp: now,
      });
    }

    if (analysis.errorBreakdown?.RATE_LIMITED > 0) {
      alerts.push({
        level: 'WARNING',
        message: `${analysis.errorBreakdown.RATE_LIMITED} rate limit errors (429) detected`,
        timestamp: now,
      });
    }

    if (analysis.errorBreakdown?.SERVICE_UNAVAILABLE > 0) {
      alerts.push({
        level: 'CRITICAL',
        message: `${analysis.errorBreakdown.SERVICE_UNAVAILABLE} service unavailable errors (503) detected`,
        timestamp: now,
      });
    }

    return alerts;
  }

  printLiveStats(analysis) {
    // Clear console for live updates
    console.clear();

    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    const remaining = Math.round((this.duration - (Date.now() - this.startTime)) / 1000);

    console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║     🏈 SUPER BOWL HALFTIME LOAD TEST MONITOR 🏈                   ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Target: ${this.baseUrl}`);
    console.log(`⏱️  Elapsed: ${elapsed}s | Remaining: ${remaining}s\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  LIVE METRICS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Success rate with visual indicator
    const successIcon = analysis.successRate > 95 ? '✅' : analysis.successRate > 90 ? '⚠️' : '❌';
    console.log(`${successIcon} Success Rate: ${analysis.successRate.toFixed(2)}%`);
    console.log(`   Total Requests: ${analysis.totalRequests}`);
    console.log(`   ✓ Successful: ${analysis.successful}`);
    console.log(`   ✗ Failed: ${analysis.failed}\n`);

    if (analysis.responseTime) {
      const rt = analysis.responseTime;
      const p95Icon = rt.p95 < 1000 ? '✅' : rt.p95 < 2000 ? '⚠️' : '❌';

      console.log(`${p95Icon} Response Times (ms):`);
      console.log(`   Min: ${rt.min.toFixed(0)}ms | Mean: ${rt.mean.toFixed(0)}ms | Max: ${rt.max.toFixed(0)}ms`);
      console.log(`   p50: ${rt.p50.toFixed(0)}ms | p75: ${rt.p75.toFixed(0)}ms | p90: ${rt.p90.toFixed(0)}ms`);
      console.log(`   p95: ${rt.p95.toFixed(0)}ms | p99: ${rt.p99.toFixed(0)}ms\n`);
    }

    if (analysis.errorBreakdown) {
      console.log('❌ Error Breakdown:');
      Object.entries(analysis.errorBreakdown).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
      console.log('');
    }

    // Active alerts
    const recentAlerts = this.alerts.slice(-5);
    if (recentAlerts.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  🚨 RECENT ALERTS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      recentAlerts.forEach(alert => {
        const icon = alert.level === 'CRITICAL' ? '🔴' : '🟡';
        console.log(`${icon} [${alert.level}] ${alert.message}`);
      });
      console.log('');
    }

    // Performance health indicator
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const health = this.calculateHealth(analysis);
    const healthBar = this.createHealthBar(health);
    console.log(`  System Health: ${healthBar} ${health.toFixed(1)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  calculateHealth(analysis) {
    let health = 100;

    // Penalize for errors
    health -= analysis.errorRate * 2;

    // Penalize for slow responses
    if (analysis.responseTime) {
      if (analysis.responseTime.p95 > 2000) health -= 20;
      else if (analysis.responseTime.p95 > 1000) health -= 10;
      else if (analysis.responseTime.p95 > 500) health -= 5;
    }

    return Math.max(0, Math.min(100, health));
  }

  createHealthBar(health) {
    const barLength = 20;
    const filled = Math.round((health / 100) * barLength);
    const empty = barLength - filled;

    let bar = '[';
    let color = health > 80 ? '🟢' : health > 60 ? '🟡' : health > 40 ? '🟠' : '🔴';

    bar += '█'.repeat(filled);
    bar += '░'.repeat(empty);
    bar += ']';

    return `${color} ${bar}`;
  }

  async start() {
    console.log('🏈 Starting Super Bowl Halftime Monitor...\n');
    console.log(`Target: ${this.baseUrl}`);
    console.log(`Check interval: ${this.interval}ms`);
    console.log(`Duration: ${this.duration}ms`);
    console.log(`Concurrent requests per check: ${this.concurrentRequests}\n`);
    console.log('Press Ctrl+C to stop early\n');

    const intervalId = setInterval(async () => {
      try {
        const results = await this.runChecks();
        const analysis = this.analyzeResults(results);
        const alerts = this.checkAlerts(analysis);

        this.metrics.push(analysis);
        this.alerts.push(...alerts);

        this.printLiveStats(analysis);

        if (Date.now() - this.startTime >= this.duration) {
          clearInterval(intervalId);
          this.stop();
        }
      } catch (error) {
        console.error('Error during monitoring:', error.message);
      }
    }, this.interval);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(intervalId);
      this.stop();
    });
  }

  generateReport() {
    const allMetrics = this.metrics;

    if (allMetrics.length === 0) {
      return null;
    }

    const avgSuccessRate = allMetrics.reduce((sum, m) => sum + m.successRate, 0) / allMetrics.length;
    const avgErrorRate = allMetrics.reduce((sum, m) => sum + m.errorRate, 0) / allMetrics.length;

    const allResponseTimes = allMetrics
      .filter(m => m.responseTime)
      .map(m => m.responseTime);

    const report = {
      summary: {
        testDuration: Date.now() - this.startTime,
        totalChecks: allMetrics.length,
        averageSuccessRate: avgSuccessRate,
        averageErrorRate: avgErrorRate,
        totalAlerts: this.alerts.length,
        criticalAlerts: this.alerts.filter(a => a.level === 'CRITICAL').length,
      },
      responseTimeAggregate: {
        avgMin: allResponseTimes.reduce((sum, rt) => sum + rt.min, 0) / allResponseTimes.length,
        avgMean: allResponseTimes.reduce((sum, rt) => sum + rt.mean, 0) / allResponseTimes.length,
        avgMax: allResponseTimes.reduce((sum, rt) => sum + rt.max, 0) / allResponseTimes.length,
        avgP95: allResponseTimes.reduce((sum, rt) => sum + rt.p95, 0) / allResponseTimes.length,
        avgP99: allResponseTimes.reduce((sum, rt) => sum + rt.p99, 0) / allResponseTimes.length,
      },
      alerts: this.alerts,
      metrics: allMetrics,
    };

    return report;
  }

  stop() {
    console.log('\n\n╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║                    MONITORING STOPPED                             ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

    const report = this.generateReport();

    if (report) {
      console.log('📊 FINAL REPORT\n');
      console.log(`Test Duration: ${Math.round(report.summary.testDuration / 1000)}s`);
      console.log(`Total Checks: ${report.summary.totalChecks}`);
      console.log(`Average Success Rate: ${report.summary.averageSuccessRate.toFixed(2)}%`);
      console.log(`Average Error Rate: ${report.summary.averageErrorRate.toFixed(2)}%`);
      console.log(`Total Alerts: ${report.summary.totalAlerts}`);
      console.log(`Critical Alerts: ${report.summary.criticalAlerts}\n`);

      console.log('Response Time Averages:');
      console.log(`  Mean: ${report.responseTimeAggregate.avgMean.toFixed(0)}ms`);
      console.log(`  p95: ${report.responseTimeAggregate.avgP95.toFixed(0)}ms`);
      console.log(`  p99: ${report.responseTimeAggregate.avgP99.toFixed(0)}ms\n`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `superbowl-monitor-${timestamp}.json`;
      const reportPath = path.join(__dirname, filename);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📁 Full report saved: ${reportPath}\n`);
    }

    process.exit(0);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const config = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];

    if (key === 'url') config.baseUrl = value;
    if (key === 'interval') config.interval = parseInt(value);
    if (key === 'duration') config.duration = parseInt(value);
    if (key === 'concurrent') config.concurrentRequests = parseInt(value);
  }

  const monitor = new SuperBowlMonitor(config);
  monitor.start();
}

module.exports = SuperBowlMonitor;
