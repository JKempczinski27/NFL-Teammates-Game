/**
 * Node.js Clustering for Multi-Core Utilization
 * Automatically spawns worker processes to utilize all CPU cores
 */

const cluster = require('cluster');
const os = require('os');

const numCPUs = os.cpus().length;
const WORKERS = parseInt(process.env.CLUSTER_WORKERS) || numCPUs;

function startCluster() {
  if (cluster.isMaster || cluster.isPrimary) {
    console.log(`\n🚀 Cluster: Master process ${process.pid} is running`);
    console.log(`💻 CPUs available: ${numCPUs}`);
    console.log(`👷 Spawning ${WORKERS} worker processes...\n`);

    // Track worker statuses
    const workers = new Map();

    // Fork workers
    for (let i = 0; i < WORKERS; i++) {
      const worker = cluster.fork();
      workers.set(worker.id, {
        pid: worker.process.pid,
        started: new Date(),
        restarts: 0
      });
    }

    // Handle worker online
    cluster.on('online', (worker) => {
      console.log(`✅ Worker ${worker.id} (PID: ${worker.process.pid}) is online`);
    });

    // Handle worker exit and auto-restart
    cluster.on('exit', (worker, code, signal) => {
      const workerInfo = workers.get(worker.id);
      const restartCount = workerInfo ? workerInfo.restarts : 0;

      console.log(`\n❌ Worker ${worker.id} (PID: ${worker.process.pid}) died`);
      console.log(`   Exit code: ${code}, Signal: ${signal}`);

      // Prevent infinite restart loops
      if (restartCount < 5) {
        console.log(`🔄 Spawning new worker to replace worker ${worker.id}...`);
        const newWorker = cluster.fork();

        workers.delete(worker.id);
        workers.set(newWorker.id, {
          pid: newWorker.process.pid,
          started: new Date(),
          restarts: restartCount + 1
        });
      } else {
        console.error(`⛔ Worker ${worker.id} has restarted too many times. Not respawning.`);
        workers.delete(worker.id);

        // If all workers are dead, exit master process
        if (workers.size === 0) {
          console.error('💀 All workers are dead. Shutting down master process.');
          process.exit(1);
        }
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM received, shutting down gracefully...');

      workers.forEach((info, id) => {
        const worker = Object.values(cluster.workers || {}).find(w => w.id === id);
        if (worker) {
          worker.send('shutdown');
          worker.disconnect();

          // Force kill after timeout
          setTimeout(() => {
            if (!worker.isDead()) {
              console.log(`⚠️  Force killing worker ${id}`);
              worker.kill();
            }
          }, 10000);
        }
      });

      // Exit master after all workers are done
      setTimeout(() => {
        console.log('👋 Master process exiting');
        process.exit(0);
      }, 12000);
    });

    // Handle messages from workers
    Object.values(cluster.workers || {}).forEach(worker => {
      worker.on('message', (msg) => {
        if (msg.cmd === 'notifyRequest') {
          // Could aggregate metrics here
          console.log(`📊 Worker ${worker.id}: ${msg.count} requests handled`);
        }
      });
    });

    // Log cluster status periodically
    if (process.env.NODE_ENV !== 'production') {
      setInterval(() => {
        console.log(`\n📊 Cluster Status:`);
        workers.forEach((info, id) => {
          const uptime = Math.floor((Date.now() - info.started) / 1000);
          console.log(`   Worker ${id}: PID ${info.pid}, Uptime: ${uptime}s, Restarts: ${info.restarts}`);
        });
      }, 60000); // Every minute
    }

  } else {
    // Worker process - load the actual server
    require('./server.js');

    // Handle shutdown message from master
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        console.log(`\n👷 Worker ${cluster.worker.id} received shutdown signal`);
        // Perform cleanup here if needed
        process.exit(0);
      }
    });

    console.log(`👷 Worker ${cluster.worker.id} (PID: ${process.pid}) started`);
  }
}

// Export for use in package.json scripts
if (require.main === module) {
  // Only cluster if explicitly enabled
  if (process.env.ENABLE_CLUSTERING === 'true') {
    startCluster();
  } else {
    console.log('ℹ️  Clustering disabled. Set ENABLE_CLUSTERING=true to enable.');
    console.log('💡 Running in single-process mode...\n');
    require('./server.js');
  }
}

module.exports = { startCluster };
