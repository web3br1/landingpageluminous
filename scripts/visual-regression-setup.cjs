#!/usr/bin/env node

/**
 * Visual Regression Setup Script
 * Helps manage visual regression baselines and testing
 */

const fs = require('fs')
const path = require('path')

const SNAPSHOTS_DIR = path.join(__dirname, '..', 'tests', 'visual-regression.spec.ts-snapshots')

function ensureSnapshotsDirectory() {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true })
    console.log('✅ Created snapshots directory:', SNAPSHOTS_DIR)
  }
}

function listBaselines() {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    console.log('❌ No snapshots directory found. Run visual tests first.')
    return
  }

  const files = fs.readdirSync(SNAPSHOTS_DIR)
  const baselines = files.filter(file => file.endsWith('.png'))

  console.log('📸 Current Visual Baselines:')
  console.log('==========================')

  if (baselines.length === 0) {
    console.log('No baseline screenshots found.')
    return
  }

  baselines.forEach(file => {
    const stats = fs.statSync(path.join(SNAPSHOTS_DIR, file))
    const size = (stats.size / 1024).toFixed(1)
    console.log(`  • ${file} (${size} KB)`)
  })

  console.log(`\n📊 Total: ${baselines.length} baseline screenshots`)
}

function cleanBaselines() {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    console.log('❌ No snapshots directory found.')
    return
  }

  const files = fs.readdirSync(SNAPSHOTS_DIR)
  let deletedCount = 0

  files.forEach(file => {
    if (file.endsWith('.png')) {
      fs.unlinkSync(path.join(SNAPSHOTS_DIR, file))
      deletedCount++
    }
  })

  console.log(`🗑️  Cleaned ${deletedCount} baseline screenshots`)
}

function showHelp() {
  console.log(`
🎨 Visual Regression Management Tool
====================================

Usage: node scripts/visual-regression-setup.js <command>

Commands:
  setup     - Ensure snapshots directory exists
  list      - List all current baseline screenshots
  clean     - Remove all baseline screenshots
  help      - Show this help message

NPM Scripts:
  npm run test:visual          - Run visual regression tests
  npm run test:visual:update   - Update visual baselines

Examples:
  node scripts/visual-regression-setup.js setup
  node scripts/visual-regression-setup.js list
  node scripts/visual-regression-setup.js clean
`)
}

function main() {
  const command = process.argv[2]

  switch (command) {
    case 'setup':
      ensureSnapshotsDirectory()
      break
    case 'list':
      listBaselines()
      break
    case 'clean':
      cleanBaselines()
      break
    case 'help':
    default:
      showHelp()
      break
  }
}

if (require.main === module) {
  main()
}
