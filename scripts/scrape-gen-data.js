#!/usr/bin/env node
// Builds a bundled PokeAPI cache for Pokeguide.
//
// Output:
//   scripts/output/pokeapi/gens-5-9.json
//   scripts/output/app-assets/data/pokeapi/gens-5-9.js
//
// Run `node scripts/install-data.js pokeapi` when you want to copy the
// generated app-readable shim into app/src/main/assets/.

const fs = require('fs');
const path = require('path');

const API = 'https://pokeapi.co/api/v2';
const CACHE_DIR = path.join(__dirname, 'cache', 'pokeapi');
const OUT_ASSET_DIR = path.join(__dirname, 'output', 'app-assets', 'data', 'pokeapi');
const OUT_JSON_DIR = path.join(__dirname, 'output', 'pokeapi');

const GEN_RANGES = {
  5: [494, 649],
  6: [650, 721],
  7: [722, 809],
  8: [810, 905],
  9: [906, 1025]
};

const GAME_IDS = [
  'black-white',
  'black-2-white-2',
  'x-y',
  'omega-ruby-alpha-sapphire',
  'sun-moon',
  'ultra-sun-ultra-moon',
  'lets-go-pikachu-lets-go-eevee',
  'sword-shield',
  'brilliant-diamond-and-shining-pearl',
  'legends-arceus',
  'scarlet-violet'
];

const GAME_VERSION_GROUP_SLUGS = {
  'brilliant-diamond-and-shining-pearl': 'brilliant-diamond-shining-pearl'
};

const REGIONS = ['unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'];

const GAME_POKEDEX = {
  'black-white': 8,
  'black-2-white-2': 9,
  'x-y': 12,
  'omega-ruby-alpha-sapphire': 14,
  'sun-moon': 16,
  'ultra-sun-ultra-moon': 21,
  'lets-go-pikachu-lets-go-eevee': 26,
  'sword-shield': 27,
  'legends-arceus': 30,
  'scarlet-violet': 31,
  'brilliant-diamond-and-shining-pearl': 5
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeUrl(url) {
  return String(url).replace(/\/+$/, '');
}

function safeName(url) {
  return normalizeUrl(url)
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9._-]+/gi, '_') + '.json';
}

function apiUrl(pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return normalizeUrl(pathOrUrl);
  return normalizeUrl(API + (pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl));
}

function idFromUrl(url) {
  const m = String(url || '').match(/\/(\d+)\/?$/);
  return m ? Number(m[1]) : 0;
}

async function fetchJson(url) {
  const cleanUrl = normalizeUrl(url);
  ensureDir(CACHE_DIR);
  const cachePath = path.join(CACHE_DIR, safeName(cleanUrl));
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }

  const res = await fetch(cleanUrl, {
    headers: {
      'User-Agent': 'Pokeguide data scraper (local personal cache)',
      'Accept': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${cleanUrl}`);
  const data = await res.json();
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf8');
  await new Promise(resolve => setTimeout(resolve, 120));
  return data;
}

async function addResource(bundle, url) {
  const cleanUrl = normalizeUrl(url);
  if (bundle.api[cleanUrl]) return bundle.api[cleanUrl];
  const data = await fetchJson(cleanUrl);
  bundle.api[cleanUrl] = data;
  return data;
}

async function addApi(bundle, pathOrUrl) {
  return addResource(bundle, apiUrl(pathOrUrl));
}

function generationIds(gens) {
  const out = [];
  for (const gen of gens) {
    const range = GEN_RANGES[gen];
    if (!range) throw new Error(`Unsupported generation: ${gen}`);
    for (let id = range[0]; id <= range[1]; id++) out.push(id);
  }
  return out;
}

function parseArgs(argv) {
  const opts = {
    gens: [5, 6, 7, 8, 9],
    includeMoves: true,
    includeItems: true,
    includeLocations: true,
    includePokemon: true,
    outName: 'gens-5-9'
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
    if (arg === '--gens') {
      opts.gens = argv[++i].split(',').map(Number).filter(Boolean);
      opts.outName = 'gens-' + opts.gens.join('-');
      continue;
    }
    if (arg === '--no-moves') {
      opts.includeMoves = false;
      continue;
    }
    if (arg === '--no-items') {
      opts.includeItems = false;
      continue;
    }
    if (arg === '--no-locations') {
      opts.includeLocations = false;
      continue;
    }
    if (arg === '--pokemon-only') {
      opts.includeMoves = false;
      opts.includeItems = false;
      opts.includeLocations = false;
      continue;
    }
    if (arg === '--out') {
      opts.outName = argv[++i] || opts.outName;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

function printHelp() {
  console.log(`Usage:
  node scripts/scrape-gen-data.js
  node scripts/scrape-gen-data.js --gens 5,6,7,8,9
  node scripts/scrape-gen-data.js --pokemon-only
  node scripts/scrape-gen-data.js --no-moves --no-items --no-locations

Builds a static PokeAPI cache bundle for the app:
  scripts/output/pokeapi/<name>.json
  scripts/output/app-assets/data/pokeapi/<name>.js

Notes:
  - Boss data is still handled by scrape-bosses.js.
  - Gen 8/9 catchability is still handled by scrape-catchability.js because
    PokeAPI encounter data is incomplete there.
  - Cached API responses live in scripts/cache/pokeapi/ for resumable runs.
  - Copy generated app assets with: node scripts/install-data.js pokeapi`);
}

async function collectPokemon(bundle, ids) {
  const moveUrls = new Set();
  const speciesUrls = new Set();
  const evoUrls = new Set();

  for (let index = 0; index < ids.length; index++) {
    const id = ids[index];
    const pokemon = await addApi(bundle, `/pokemon/${id}`);
    speciesUrls.add(normalizeUrl(pokemon.species.url));
    for (const m of pokemon.moves || []) moveUrls.add(normalizeUrl(m.move.url));
    await addApi(bundle, `/pokemon/${id}/encounters`);

    if ((index + 1) % 25 === 0 || index === ids.length - 1) {
      console.log(`  pokemon ${index + 1}/${ids.length}`);
    }
  }

  let spIndex = 0;
  for (const url of speciesUrls) {
    const species = await addResource(bundle, url);
    if (species.evolution_chain && species.evolution_chain.url) {
      evoUrls.add(normalizeUrl(species.evolution_chain.url));
    }
    spIndex++;
    if (spIndex % 50 === 0 || spIndex === speciesUrls.size) {
      console.log(`  species ${spIndex}/${speciesUrls.size}`);
    }
  }

  let evIndex = 0;
  for (const url of evoUrls) {
    await addResource(bundle, url);
    evIndex++;
    if (evIndex % 50 === 0 || evIndex === evoUrls.size) {
      console.log(`  evolution chains ${evIndex}/${evoUrls.size}`);
    }
  }

  return { moveUrls };
}

async function collectCoreLists(bundle, gens) {
  await addApi(bundle, '/pokemon?limit=1025&offset=0');
  await addApi(bundle, '/region?limit=20');
  await addApi(bundle, '/move?limit=1000&offset=0');
  await addApi(bundle, '/item?limit=500&offset=0');
  await addApi(bundle, '/item-category/37');

  for (const gen of gens) await addApi(bundle, `/generation/${gen}`);
  for (const gameId of GAME_IDS) {
    const apiSlug = GAME_VERSION_GROUP_SLUGS[gameId] || gameId;
    const data = await addApi(bundle, `/version-group/${apiSlug}`);
    const appUrl = apiUrl(`/version-group/${gameId}`);
    if (appUrl !== apiUrl(`/version-group/${apiSlug}`)) {
      bundle.api[appUrl] = data;
    }
  }
  for (const [gameId, dexId] of Object.entries(GAME_POKEDEX)) {
    if (GAME_IDS.includes(gameId)) await addApi(bundle, `/pokedex/${dexId}`);
  }
}

async function collectMoves(bundle, moveUrls) {
  const urls = Array.from(moveUrls).sort((a, b) => idFromUrl(a) - idFromUrl(b));
  for (let i = 0; i < urls.length; i++) {
    await addResource(bundle, urls[i]);
    if ((i + 1) % 50 === 0 || i === urls.length - 1) {
      console.log(`  moves ${i + 1}/${urls.length}`);
    }
  }
}

async function collectItems(bundle) {
  const list = await addApi(bundle, '/item?limit=500&offset=0');
  const itemUrls = (list.results || []).map(i => normalizeUrl(i.url));
  const machineUrls = new Set();

  for (let i = 0; i < itemUrls.length; i++) {
    const item = await addResource(bundle, itemUrls[i]);
    for (const machineRef of item.machines || []) {
      machineUrls.add(normalizeUrl(machineRef.machine.url));
    }
    if ((i + 1) % 50 === 0 || i === itemUrls.length - 1) {
      console.log(`  items ${i + 1}/${itemUrls.length}`);
    }
  }

  const machineList = Array.from(machineUrls).sort((a, b) => idFromUrl(a) - idFromUrl(b));
  for (let i = 0; i < machineList.length; i++) {
    await addResource(bundle, machineList[i]);
    if ((i + 1) % 50 === 0 || i === machineList.length - 1) {
      console.log(`  machines ${i + 1}/${machineList.length}`);
    }
  }
}

async function collectLocations(bundle) {
  const locationUrls = new Set();
  const areaUrls = new Set();

  for (const region of REGIONS) {
    try {
      const data = await addApi(bundle, `/region/${region}`);
      for (const loc of data.locations || []) locationUrls.add(normalizeUrl(loc.url));
      if (data.main_generation && data.main_generation.url) {
        await addResource(bundle, data.main_generation.url);
      }
    } catch (e) {
      console.warn(`  ! skipped region ${region}: ${e.message}`);
    }
  }

  const locs = Array.from(locationUrls).sort();
  for (let i = 0; i < locs.length; i++) {
    const loc = await addResource(bundle, locs[i]);
    for (const area of loc.areas || []) areaUrls.add(normalizeUrl(area.url));
    if ((i + 1) % 50 === 0 || i === locs.length - 1) {
      console.log(`  locations ${i + 1}/${locs.length}`);
    }
  }

  const areas = Array.from(areaUrls).sort();
  for (let i = 0; i < areas.length; i++) {
    await addResource(bundle, areas[i]);
    if ((i + 1) % 50 === 0 || i === areas.length - 1) {
      console.log(`  location areas ${i + 1}/${areas.length}`);
    }
  }
}

function writeBundle(bundle, outName) {
  ensureDir(OUT_ASSET_DIR);
  ensureDir(OUT_JSON_DIR);
  const jsonPath = path.join(OUT_JSON_DIR, `${outName}.json`);
  const jsPath = path.join(OUT_ASSET_DIR, `${outName}.js`);
  const body = JSON.stringify(bundle, null, 2);
  fs.writeFileSync(jsonPath, body, 'utf8');
  fs.writeFileSync(
    jsPath,
    '// Auto-generated by scripts/scrape-gen-data.js - do not edit by hand.\n' +
    'window.POKEGUIDE_STATIC_API = ' + JSON.stringify(bundle.api) + ';\n',
    'utf8'
  );
  console.log(`\nWrote ${Object.keys(bundle.api).length} cached API responses`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${jsPath}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const ids = generationIds(opts.gens);
  const bundle = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: API,
    scope: {
      generations: opts.gens,
      pokemonIds: [ids[0], ids[ids.length - 1]],
      games: GAME_IDS
    },
    api: {}
  };

  console.log(`Building ${opts.outName} for gens ${opts.gens.join(', ')} (${ids.length} Pokemon)`);
  await collectCoreLists(bundle, opts.gens);

  let moveUrls = new Set();
  if (opts.includePokemon) {
    console.log('Pokemon, species, evolutions, and encounters');
    const result = await collectPokemon(bundle, ids);
    moveUrls = result.moveUrls;
  }
  if (opts.includeMoves) {
    console.log('Moves learned by bundled Pokemon');
    await collectMoves(bundle, moveUrls);
  }
  if (opts.includeItems) {
    console.log('Items and machines');
    await collectItems(bundle);
  }
  if (opts.includeLocations) {
    console.log('Regions, locations, and location areas');
    await collectLocations(bundle);
  }

  writeBundle(bundle, opts.outName);
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
