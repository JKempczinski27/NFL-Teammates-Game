#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Monitors the NFL Teammates Game backend performance in real-time
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://nfl-teammates-game-production.up.railway.app';
    this.interval = config.interval || 5000; // 5 seconds
    this.duration = config.duration || 60000; // 1 minute
    this.metrics = [];
    this.startTime = Date.now();
  }

  async checkEndpoint(endpoint, method = 'GET', data = null) {
    const start = Date.now();
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        timeout: 10000,
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
        timestamp: new Date().toISOString(),
      };
    }
  }

  async runChecks() {
    const checks = [
      this.checkEndpoint('/'),
      this.checkEndpoint('/api/track'),
      this.checkEndpoint('/api/track', 'POST', {
        eventType: 'monitor_test',
        sessionId: `monitor-${Date.now()}`,
        timestamp: Date.now(),
      }),
      this.checkEndpoint('/api/db-test'),
    ];

    const results = await Promise.all(checks);
    return results;
  }

  calculateStats() {
    const allMetrics = this.metrics.flat();

    if (allMetrics.length === 0) {
      return null;
    }

    const successful = allMetrics.filter(m => m.success);
    const failed = allMetrics.filter(m => !m.success);
    const durations = successful.map(m => m.duration).sort((a, b) => a - b);

    const stats = {
      totalRequests: allMetrics.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: (successful.length / allMetrics.length) * 100,
      errorRate: (failed.length / allMetrics.length) * 100,
    };

    if (durations.length > 0) {
      stats.responseTime = {
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

    // Stats by endpoint
    const endpoints = {};
    allMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpoints[key]) {
        endpoints[key] = {
          total: 0,
          successful: 0,
          failed: 0,
          durations: [],
        };
      }
      endpoints[key].total++;
      if (metric.success) {
        endpoints[key].successful++;
        endpoints[key].durations.push(metric.duration);
      } else {
        endpoints[key].failed++;
      }
    });

    Object.keys(endpoints).forEach(key => {
      const ep = endpoints[key];
      if (ep.durations.length > 0) {
        ep.avgDuration = ep.durations.reduce((a, b) => a + b, 0) / ep.durations.length;
      }
      delete ep.durations; // Remove raw durations to keep output clean
    });

    stats.byEndpoint = endpoints;

    return stats;
  }

  printStats() {
    const stats = this.calculateStats();

    if (!stats) {
      console.log('No data collected yet.');
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log('PERFORMANCE MONITORING REPORT');
    console.log('='.repeat(60));
    console.log(`\nMonitoring Duration: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
    console.log(`Target: ${this.baseUrl}`);

    console.log('\n--- OVERALL METRICS ---');
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Successful: ${stats.successfulRequests} (${stats.successRate.toFixed(2)}%)`);
    console.log(`Failed: ${stats.failedRequests} (${stats.errorRate.toFixed(2)}%)`);

    if (stats.responseTime) {
      console.log('\n--- RESPONSE TIMES (ms) ---');
      console.log(`Min: ${stats.responseTime.min.toFixed(2)}`);
      console.log(`Mean: ${stats.responseTime.mean.toFixed(2)}`);
      console.log(`Max: ${stats.responseTime.max.toFixed(2)}`);
      console.log(`p50: ${stats.responseTime.p50.toFixed(2)}`);
      console.log(`p75: ${stats.responseTime.p75.toFixed(2)}`);
      console.log(`p90: ${stats.responseTime.p90.toFixed(2)}`);
      console.log(`p95: ${stats.responseTime.p95.toFixed(2)}`);
      console.log(`p99: ${stats.responseTime.p99.toFixed(2)}`);
    }

    console.log('\n--- BY ENDPOINT ---');
    Object.entries(stats.byEndpoint).forEach(([endpoint, data]) => {
      console.log(`\n${endpoint}:`);
      console.log(`  Total: ${data.total} | Success: ${data.successful} | Failed: ${data.failed}`);
      if (data.avgDuration) {
        console.log(`  Avg Duration: ${data.avgDuration.toFixed(2)}ms`);
      }
    });

    console.log('\n' + '='.repeat(60) + '\n');
  }

  async saveReport(filename) {
    const stats = this.calculateStats();
    const report = {
      generatedAt: new Date().toISOString(),
      monitoringDuration: Date.now() - this.startTime,
      baseUrl: this.baseUrl,
      stats,
      rawMetrics: this.metrics,
    };

    const reportPath = path.join(__dirname, filename);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);
  }

  async start() {
    console.log(`Starting performance monitoring...`);
    console.log(`Target: ${this.baseUrl}`);
    console.log(`Check interval: ${this.interval}ms`);
    console.log(`Duration: ${this.duration}ms`);
    console.log(`Press Ctrl+C to stop early\n`);

    const intervalId = setInterval(async () => {
      process.stdout.write('.');
      const results = await this.runChecks();
      this.metrics.push(results);

      if (Date.now() - this.startTime >= this.duration) {
        clearInterval(intervalId);
        this.stop();
      }
    }, this.interval);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(intervalId);
      this.stop();
    });
  }

  stop() {
    console.log('\n\nMonitoring stopped.');
    this.printStats();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.saveReport(`performance-report-${timestamp}.json`);

    process.exit(0);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const config = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];

    if (key === 'url') config.baseUrl = value;
    if (key === 'interval') config.interval = parseInt(value);
    if (key === 'duration') config.duration = parseInt(value);
  }

  const monitor = new PerformanceMonitor(config);
  monitor.start();
}

module.exports = PerformanceMonitor;
