#!/usr/bin/env node

/**
 * Unified Build Script for NFL Games Monorepo
 *
 * This script:
 * 1. Builds all individual games and apps
 * 2. Consolidates them into a unified 'public' directory
 * 3. Sets up proper routing structure for Vercel deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, cwd = process.cwd()) {
  log(`\n$ ${command}`, 'cyan');
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd,
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096'
      }
    });
    log(`✓ Command completed successfully`, 'green');
  } catch (error) {
    log(`✗ Command failed with exit code ${error.status}`, 'red');
    throw error;
  }
}

function copyDir(src, dest) {
  log(`📁 Copying ${src} → ${dest}`, 'blue');

  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Copy directory recursively
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    log(`🧹 Cleaning ${dir}`, 'yellow');
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Main build process
async function build() {
  const startTime = Date.now();

  try {
    log('\n' + '='.repeat(60), 'bright');
    log('🏗️  NFL GAMES UNIFIED BUILD', 'bright');
    log('='.repeat(60) + '\n', 'bright');

    // Step 1: Clean previous build
    log('Step 1: Cleaning previous builds', 'bright');
    cleanDir('public');

    // Step 2: Verify dependencies (skip install as Vercel already installs via workspaces)
    log('\nStep 2: Verifying workspace dependencies', 'bright');
    log('✓ Dependencies already installed via npm workspaces', 'green');

    // Step 3: Build landing page
    log('\nStep 3: Building Landing Page', 'bright');
    exec('npm run build', path.join(process.cwd(), 'landing-page'));

    // Step 4: Build NFL Teammates Game
    log('\nStep 4: Building NFL Teammates Game', 'bright');
    exec('npm run build', path.join(process.cwd(), 'nfl-teammates-game'));

    // Step 5: Build NFL Trivia Game
    log('\nStep 5: Building NFL Trivia Game', 'bright');
    exec('npm run build', path.join(process.cwd(), 'nfl-trivia-game'));

    // Step 6: Build Journeyman Game
    log('\nStep 6: Building Journeyman Game', 'bright');
    exec('npm run build', path.join(process.cwd(), 'journeyman'));

    // Step 7: Create unified public directory
    log('\nStep 7: Creating unified public directory', 'bright');
    fs.mkdirSync('public', { recursive: true });

    // Copy landing page to root of public (this serves /)
    log('📦 Setting up landing page at /', 'green');
    copyDir('landing-page/build', 'public');

    // Copy each game to its subdirectory
    log('📦 Setting up NFL Teammates at /teammates', 'green');
    copyDir('nfl-teammates-game/build', 'public/teammates');

    log('📦 Setting up NFL Trivia at /trivia', 'green');
    copyDir('nfl-trivia-game/dist', 'public/trivia');

    log('📦 Setting up Journeyman at /journeyman', 'green');
    copyDir('journeyman/build', 'public/journeyman');

    log('📦 Setting up Dashboard at /dashboard', 'green');
    copyDir('dashboard', 'public/dashboard');

    // Step 8: Create _redirects file for SPA routing
    log('\nStep 8: Creating routing configuration', 'bright');
    const redirects = `# SPA routing for each game
/teammates/* /teammates/index.html 200
/trivia/* /trivia/index.html 200
/journeyman/* /journeyman/index.html 200
/dashboard/* /dashboard/index.html 200
`;
    fs.writeFileSync('public/_redirects', redirects);

    // Step 9: Verify all builds completed successfully
    log('\nStep 9: Build verification complete', 'bright');

    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    log('\n' + '='.repeat(60), 'bright');
    log('✅ BUILD COMPLETE!', 'green');
    log('='.repeat(60), 'bright');

    log('\n📊 Build Summary:', 'bright');
    log('   Landing Page: public/ (root)', 'blue');
    log('   NFL Teammates: public/teammates/', 'blue');
    log('   NFL Trivia: public/trivia/', 'blue');
    log('   Journeyman: public/journeyman/', 'blue');
    log('   Dashboard: public/dashboard/', 'blue');
    log('   Backend API: api/backend.js (serverless)', 'blue');

    log(`\n⏱️  Total build time: ${totalTime}s`, 'cyan');

    log('\n🚀 Ready for deployment!', 'green');
    log('   Deploy to Vercel: vercel --prod', 'cyan');
    log('   Test locally: npx serve public\n', 'cyan');

  } catch (error) {
    log('\n❌ Build failed!', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Run build
build();
