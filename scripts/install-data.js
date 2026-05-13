#!/usr/bin/env node
// Copies generated scraper output into Android assets in the exact format the
// WebView app reads. Scrapers write to scripts/output/ first so collecting data
// is separate from deciding what to bundle in the APK.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ASSETS = path.join(__dirname, 'output', 'app-assets');
const APP_ASSETS = path.join(ROOT, 'app', 'src', 'main', 'assets');

const TARGETS = {
  pokeapi: [
    ['data/pokeapi/gens-5-9.js', 'data/pokeapi/gens-5-9.js']
  ],
  catch: [
    ['data/catch/manifest.js', 'data/catch/manifest.js'],
    ['data/catch/sword-shield.js', 'data/catch/sword-shield.js'],
    ['data/catch/brilliant-diamond-and-shining-pearl.js', 'data/catch/brilliant-diamond-and-shining-pearl.js'],
    ['data/catch/legends-arceus.js', 'data/catch/legends-arceus.js'],
    ['data/catch/scarlet-violet.js', 'data/catch/scarlet-violet.js'],
    ['data/catch/lets-go-pikachu-lets-go-eevee.js', 'data/catch/lets-go-pikachu-lets-go-eevee.js']
  ],
  bosses: [
    ['bosses.js', 'bosses.js']
  ]
};

function usage() {
  console.log(`Usage:
  node scripts/install-data.js pokeapi
  node scripts/install-data.js catch
  node scripts/install-data.js bosses
  node scripts/install-data.js all

Copies generated files from scripts/output/app-assets/ into app/src/main/assets/.`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(fromRel, toRel) {
  const from = path.join(OUTPUT_ASSETS, fromRel);
  const to = path.join(APP_ASSETS, toRel);
  if (!fs.existsSync(from)) {
    throw new Error(`Generated file not found: ${from}`);
  }
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
  console.log(`${fromRel} -> app/src/main/assets/${toRel}`);
}

function main() {
  const arg = process.argv[2];
  if (!arg || arg === '--help' || arg === '-h') {
    usage();
    process.exit(arg ? 0 : 1);
  }

  const names = arg === 'all' ? Object.keys(TARGETS) : [arg];
  for (const name of names) {
    const files = TARGETS[name];
    if (!files) throw new Error(`Unknown target: ${name}`);
    for (const [fromRel, toRel] of files) copyFile(fromRel, toRel);
  }
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
