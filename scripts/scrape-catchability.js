#!/usr/bin/env node
// Scrapes per-pokémon catchability data for Gen 8/9 games from PokémonDB and
// emits one JSON file per game in app/src/main/assets/data/catch/.

// JSDOM uses a lot of memory parsing 600+ heavy HTML pages. Node's default
// 4 GB heap isn't enough. If we weren't started with a bigger heap, re-spawn
// ourselves with --max-old-space-size=8192 so users don't have to remember
// to set the flag manually.
if (!process.env._POKEGUIDE_SCRAPER_BIG_HEAP) {
  const child = require('child_process').spawnSync(
    process.execPath,
    ['--max-old-space-size=8192', __filename, ...process.argv.slice(2)],
    { stdio: 'inherit', env: { ...process.env, _POKEGUIDE_SCRAPER_BIG_HEAP: '1' } }
  );
  process.exit(child.status || 0);
}
//
// Strategy:
//   1. For each game, fetch the game's pokédex listing page (e.g.
//      https://pokemondb.net/pokedex/game/sword-shield) which lists every
//      species available in that game.
//   2. For each species, fetch /pokedex/{name} and extract the row in the
//      "Where to find" table corresponding to this game. That row tells us
//      either "Trade/migrate", "Not available", or a list of locations
//      (linked to /location/{slug}).
//   3. For each unique location, fetch /location/{slug} once and parse the
//      tables — one section per Generation, then sub-sections per method
//      (Walking, Surfing, Super Rod, etc), then weather/biome groups, then
//      rows of (Pokémon, Sw/Sh badge, Rarity, Levels).
//   4. Cross-reference the location data with each species to produce an
//      output record listing every catch site for that species in this game.
//
// Output format (per game):
//   {
//     "game": "sword-shield",
//     "scrapedAt": "2026-04-28T...",
//     "version": 1,
//     "pokemon": {
//       "lillipup": [
//         { "location": "Training Lowlands", "method": "Walking",
//           "rarity": "60%", "levels": "16-21", "weather": "Normal Weather",
//           "versionExclusivity": null,  // null=both, "sword", or "shield"
//           "dlc": "isle-of-armor",      // null=base game, "isle-of-armor", "crown-tundra"
//           "biome": null }
//       ]
//     },
//     "available": ["lillipup", "blipbug", ...],     // every catchable species (used for dex filter)
//     "notes": {
//       "magearna": "Mystery Gift only",            // special-case notes
//       ...
//     }
//   }
//
// Caching: every fetched page is saved to scripts/cache/catch/<game>/<slug>.html
// so re-runs are incremental and don't hammer PokémonDB.
//
// Usage:
//   node scripts/scrape-catchability.js sword-shield
//   node scripts/scrape-catchability.js --all       # scrapes all configured games

const fs = require('fs');
const path = require('path');
const https = require('https');
const { JSDOM } = require('jsdom');

// Headers to look like a normal browser — PokémonDB sometimes rate-limits or blocks bot-looking traffic.
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CACHE_DIR = path.join(__dirname, 'cache', 'catch');
const OUTPUT_DIR = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'data', 'catch');

// Games we scrape. The slug is the URL path on PokémonDB; gameId matches our app's GAMES array.
// `pokedexPages` is a list of URLs whose species lists are merged. SwSh and SV
// have separate DLC pages on PokémonDB so we fetch them all and dedupe — base
// game alone misses Lillipup, Caterpie, Charmander, etc. that are catchable
// only via DLC.
const GAMES = {
  'sword-shield': {
    slug: 'sword-shield',
    pokedexPages: [
      'https://pokemondb.net/pokedex/game/sword-shield',
      'https://pokemondb.net/pokedex/game/sword-shield/isle-of-armor',
      'https://pokemondb.net/pokedex/game/sword-shield/crown-tundra'
    ],
    versionLabels: ['Sw', 'Sh'],            // column labels in location tables
    versionMap: { Sw: 'sword', Sh: 'shield' },
    dlcRegions: ['isle-of-armor', 'crown-tundra'],
    locationPrefix: 'galar'                 // /location/galar-* are SwSh locations
  },
  'brilliant-diamond-and-shining-pearl': {
    slug: 'brilliant-diamond-shining-pearl',
    pokedexPages: ['https://pokemondb.net/pokedex/game/brilliant-diamond-shining-pearl'],
    versionLabels: ['BD', 'SP'],
    versionMap: { BD: 'brilliant-diamond', SP: 'shining-pearl' },
    dlcRegions: [],
    locationPrefix: 'sinnoh'
  },
  'legends-arceus': {
    slug: 'legends-arceus',
    pokedexPages: ['https://pokemondb.net/pokedex/game/legends-arceus'],
    versionLabels: ['LA'],
    versionMap: { LA: 'legends-arceus' },
    dlcRegions: [],
    locationPrefix: 'hisui'
  },
  'scarlet-violet': {
    slug: 'scarlet-violet',
    pokedexPages: [
      'https://pokemondb.net/pokedex/game/scarlet-violet',
      'https://pokemondb.net/pokedex/game/scarlet-violet/teal-mask',
      'https://pokemondb.net/pokedex/game/scarlet-violet/indigo-disk'
    ],
    versionLabels: ['Sc', 'Vi'],
    versionMap: { Sc: 'scarlet', Vi: 'violet' },
    dlcRegions: ['teal-mask', 'indigo-disk'],
    locationPrefix: 'paldea'
  },
  'lets-go-pikachu-lets-go-eevee': {
    slug: 'lets-go-pikachu-eevee',
    pokedexPages: ['https://pokemondb.net/pokedex/game/lets-go-pikachu-eevee'],
    versionLabels: ['LGP', 'LGE'],
    versionMap: { LGP: 'lets-go-pikachu', LGE: 'lets-go-eevee' },
    dlcRegions: [],
    locationPrefix: 'kanto'
  },
  'x-y': {
    slug: 'x-y',
    pokedexPages: ['https://pokemondb.net/pokedex/game/x-y'],
    versionLabels: ['X', 'Y'],
    versionMap: { X: 'x', Y: 'y' },
    dlcRegions: [],
    locationPrefix: 'kalos'
  },
  'omega-ruby-alpha-sapphire': {
    slug: 'omega-ruby-alpha-sapphire',
    pokedexPages: ['https://pokemondb.net/pokedex/game/omega-ruby-alpha-sapphire'],
    versionLabels: ['OR', 'AS'],
    versionMap: { OR: 'omega-ruby', AS: 'alpha-sapphire' },
    dlcRegions: [],
    locationPrefix: 'hoenn'
  },
  'black-white': {
    slug: 'black-white',
    pokedexPages: ['https://pokemondb.net/pokedex/game/black-white'],
    versionLabels: ['B', 'W'],
    versionMap: { B: 'black', W: 'white' },
    dlcRegions: [],
    locationPrefix: 'unova'
  },
  'black-2-white-2': {
    slug: 'black-white-2',
    pokedexPages: ['https://pokemondb.net/pokedex/game/black-white-2'],
    versionLabels: ['B2', 'W2'],
    versionMap: { B2: 'black-2', W2: 'white-2' },
    dlcRegions: [],
    locationPrefix: 'unova'
  }
};

// ── HTTP / cache helpers ───────────────────────────────────────────────────
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(fetchUrl(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('Timeout')));
  });
}

async function getPage(url, cachePath) {
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, 'utf8');
  }
  ensureDir(path.dirname(cachePath));
  console.log(`[fetch] ${url}`);
  const html = await fetchUrl(url);
  fs.writeFileSync(cachePath, html, 'utf8');
  // Polite delay so we don't hammer PokémonDB
  await new Promise(r => setTimeout(r, 1200));
  return html;
}

// ── Parsing helpers ────────────────────────────────────────────────────────
// Parse HTML, run a callback against the document, then close the JSDOM
// window so its memory can be GC'd. Returning the document and letting the
// caller use it keeps the entire DOM tree alive — which adds up fast across
// 600+ pokémon pages and OOMs Node's default 4GB heap.
function withParsedHTML(html, fn) {
  const dom = new JSDOM(html);
  try {
    return fn(dom.window.document);
  } finally {
    dom.window.close();
  }
}
function parseHTML(html) {
  // Kept for the test path. Don't call this in the main scrape loop — use
  // withParsedHTML instead so memory is released after parsing.
  return new JSDOM(html).window.document;
}

// Extract list of pokémon from a game's pokédex listing page.
// Returns array of { name, slug } where slug is the PokémonDB URL slug.
function parseGamePokedex(doc, gameKey) {
  const out = [];
  // Pokédex pages render each pokémon as an <a class="ent-name" href="/pokedex/<slug>">
  const links = doc.querySelectorAll('a.ent-name[href^="/pokedex/"]');
  const seen = new Set();
  for (const a of links) {
    const slug = a.getAttribute('href').replace('/pokedex/', '').replace(/\/.*$/, '');
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ name: a.textContent.trim(), slug });
  }
  return out;
}

// On a per-pokémon page, find the row in the "Where to find" table for our game
// and extract location links. Returns { locations: [{name, slug}], note: string|null }.
// note is used for "Not available", "Trade/migrate", "Mystery Gift only", etc.
function parsePokemonLocations(doc, gameKey) {
  const config = GAMES[gameKey];
  const locTable = findLocationTable(doc);
  if (!locTable) {
    // Debug: collect every h2 we saw so we can spot why the section wasn't found.
    const h2s = Array.from(doc.querySelectorAll('h2')).map(h => h.textContent.trim());
    return { locations: [], note: 'No location table', _debugH2s: h2s.slice(0, 10) };
  }

  // Each <tr> has one or two <th> game-name cells then a single <td> with the location text.
  // We look for rows whose <th> text contains any of the version labels.
  for (const tr of locTable.querySelectorAll('tr')) {
    const ths = tr.querySelectorAll('th');
    if (!ths.length) continue;
    const headerText = Array.from(ths).map(t => t.textContent.trim()).join(' ');
    if (!matchesGameHeader(headerText, gameKey)) continue;
    const td = tr.querySelector('td');
    if (!td) return { locations: [], note: null };
    const text = td.textContent.trim();
    if (/^Not available/i.test(text)) return { locations: [], note: 'Not available in this game' };
    if (/^Trade\/migrate/i.test(text)) return { locations: [], note: 'Trade or migrate from another game' };
    if (/^Location data not yet available/i.test(text)) return { locations: [], note: null };
    // Extract /location/<slug> links
    const locs = [];
    for (const a of td.querySelectorAll('a[href^="/location/"]')) {
      const slug = a.getAttribute('href').replace('/location/', '').replace(/\/$/, '');
      locs.push({ name: a.textContent.trim(), slug });
    }
    // No link → text-only note (e.g. "Evolve Lillipup")
    if (!locs.length && text) return { locations: [], note: text };
    return { locations: locs, note: null };
  }
  // Found a table but no row matched our game's header. Dump the headers we saw
  // so the user can spot if PokémonDB renamed something or our regex is off.
  const seenHeaders = [];
  for (const tr of locTable.querySelectorAll('tr')) {
    const ths = tr.querySelectorAll('th');
    if (ths.length) seenHeaders.push(Array.from(ths).map(t => t.textContent.trim()).join(' | '));
  }
  return { locations: [], note: 'Game row not found', _debugHeaders: seenHeaders };
}

function findLocationTable(doc) {
  // PokémonDB wraps tables in <div class="resp-scroll"> (and other
  // wrappers), so we can't use nextElementSibling traversal — the table
  // is several levels of nesting away from its <h2>. Instead, find the
  // h2 then walk forward through ALL descendants until we hit a <table>.
  const headings = doc.querySelectorAll('h2');
  for (const h of headings) {
    if (!/where to find/i.test(h.textContent)) continue;
    // Walk the document order from this h2 forward, looking for the next
    // table that comes BEFORE the next h2.
    let node = h;
    while (node) {
      node = nextInDocOrder(node);
      if (!node) break;
      if (node.tagName === 'H2') break;          // hit the next section
      if (node.tagName === 'TABLE') return node;
    }
  }
  return null;
}
// Iterate document nodes in order — equivalent to a TreeWalker but works
// against an Element root with all descendants.
function nextInDocOrder(node) {
  if (node.firstElementChild) return node.firstElementChild;
  while (node) {
    if (node.nextElementSibling) return node.nextElementSibling;
    node = node.parentElement;
  }
  return null;
}

function matchesGameHeader(headerText, gameKey) {
  // Normalize: lowercase, replace curly quotes/dashes with ASCII, collapse spaces.
  const norm = headerText.toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  // Map game keys to regexes against the (joined) header text. We want to
  // match BOTH the case where PokémonDB merges versions into one cell
  // ("Brilliant Diamond Shining Pearl") AND the case where they're split
  // across two adjacent rows. We handle the split case by also matching just
  // ONE half of the version name — because the table has THE SAME LOCATION
  // TD spanning both header rows with rowspan, so any matching header in the
  // group hits the same TD.
  const M = {
    'sword-shield':                          /^sword(\s*shield)?$|^shield$|sword\s*shield/,
    'brilliant-diamond-and-shining-pearl':   /^brilliant\s*diamond$|^shining\s*pearl$|brilliant\s*diamond\s*shining\s*pearl/,
    'legends-arceus':                        /legends:?\s*arceus/,
    'scarlet-violet':                        /^scarlet$|^violet$|scarlet\s*violet/,
    'lets-go-pikachu-lets-go-eevee':         /let'?s\s*go\s*pikachu|let'?s\s*go\s*eevee/,
    'x-y':                                   /\bx\s*y\b/,
    'omega-ruby-alpha-sapphire':             /omega\s*ruby|alpha\s*sapphire/,
    'black-white':                           /black\s*white/,
    'black-2-white-2':                       /black\s*2|white\s*2/
  };
  if (!M[gameKey]) return false;
  return M[gameKey].test(norm);
}

// Parse a /location/<slug> page and return rows for our specific generation.
// Returns array of { pokemon, method, weather, biome, rarity, levels, versions[] }
//
// PokémonDB's location pages historically used "Generation N - Subarea" h2
// headings, but for newer games they sometimes use just the version names
// ("Sword/Shield", "Sword/Shield - Isle of Armor") or skip section headings
// entirely. We can't rely on gen-number matching; instead we walk every
// table on the page and ACCEPT a row only if its <th> badges include one of
// this game's version labels. That way we don't care about heading text.
function parseLocationPage(doc, gameKey) {
  const config = GAMES[gameKey];
  const rows = [];

  // We still need (subarea, method) context as we walk. The page layout is
  // section-h2 → method-h3 → table, so we keep the most recent h2/h3 we saw
  // and attribute each table row to them.
  let currentSubarea = '';
  let currentMethod = '';

  // Use TreeWalker-style document iteration so wrapping <div>s don't break
  // sibling-based walks (same fix as findLocationTable).
  function walkAll(root) {
    const out = [];
    let n = root.firstElementChild;
    while (n) {
      out.push(n);
      if (n.firstElementChild) {
        const sub = walkAll(n);
        for (const x of sub) out.push(x);
      }
      n = n.nextElementSibling;
    }
    return out;
  }
  // Cleaner: use querySelectorAll('h2, h3, table') in document order.
  const elements = doc.querySelectorAll('h2, h3, table');

  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'h2') {
      // Strip the "Generation N - " prefix that PokémonDB prepends. We only
      // care about the subarea name (e.g. "Beach", "Cave", or just "" if the
      // page has no biome subdivision and the H2 is just "Generation N").
      const raw = el.textContent.trim();
      const m = raw.match(/^Generation\s+\d+\s*-\s*(.*)$/i);
      currentSubarea = m ? m[1].trim() : (/^Generation\s+\d+$/i.test(raw) ? '' : raw);
      currentMethod = '';
    } else if (tag === 'h3') {
      currentMethod = el.textContent.trim();
    } else if (tag === 'table') {
      // Accept any table that contains at least one /pokedex/<slug> link.
      // PokémonDB renders encounter tables this way across all games. Earlier
      // we required a literal version-label text cell ("Sw", "Sc", etc.), but
      // SV renders version columns as image badges (no text), so the gate
      // rejected every SV table. Pokemon-link presence is a more reliable
      // discriminator — it filters out sidebar/info tables but accepts any
      // game's encounter tables.
      const tableHasPokemon = el.querySelector('a[href^="/pokedex/"]') !== null;
      if (!tableHasPokemon) continue;
      parseEncounterTable(el, gameKey, currentSubarea, currentMethod, rows);
    }
  }

  // Dedupe: PokémonDB sometimes duplicates rows when a pokémon spans both
  // versions and the table renders one row per version. We collapse rows
  // where (pokemon, subarea, method, rarity, levels) match.
  const dedup = {};
  for (const r of rows) {
    const k = [r.pokemon, r.subarea, r.method, r.weather, r.rarity, r.levels].join('|');
    if (!dedup[k]) dedup[k] = r;
    else {
      // Merge versions
      for (const v of r.versions) {
        if (dedup[k].versions.indexOf(v) < 0) dedup[k].versions.push(v);
      }
    }
  }
  return Object.values(dedup);
}

// Iterate every <td>/<th> text content in a table, used for version-badge detection.
function* table_text_cells(table) {
  for (const cell of table.querySelectorAll('td, th')) {
    yield cell.textContent.trim();
  }
}

function parseEncounterTable(table, gameKey, subarea, method, outRows) {
  const config = GAMES[gameKey];
  // Tables look like:
  //   <thead><tr> Pokémon | Games | Rarity | Levels | Details
  //   <tbody>
  //     <tr class="ent-name-row"> [biome/weather header row spanning all cols]
  //     <tr> Pokémon | Sw/Sh badges | rarity% | levels | details
  let currentBiome = null;
  for (const tr of table.querySelectorAll('tr')) {
    const tds = tr.querySelectorAll('td');
    if (!tds.length) continue;
    // A "header-style" row inside tbody is a single full-width td with biome/weather text.
    // We detect it by checking colspan or just by absence of the pokemon link.
    const pokeLink = tr.querySelector('a[href^="/pokedex/"]');
    if (!pokeLink) {
      // It's a sub-header (biome / weather). Capture the text.
      const text = tr.textContent.trim();
      if (text && !/^Pokémon/i.test(text)) currentBiome = text;
      continue;
    }
    // Real encounter row
    const slug = pokeLink.getAttribute('href').replace('/pokedex/', '').replace(/\/$/, '');
    // Game version badges. PokémonDB renders these inconsistently across games:
    //   - Older games: text content like "Sw" / "Sh" / "Sc" / "Vi"
    //   - Newer games (SV): image badges like <img alt="Scarlet" src="...">
    //   - Some pages: nothing in the row (the whole table is implicitly the game)
    // Try all three sources. If none yield versions, default to ALL of this
    // game's versions — better to over-attribute than to drop the row.
    const versions = [];
    for (const td of tds) {
      // Source 1: text labels
      const txt = td.textContent.trim();
      if (config.versionLabels.includes(txt) && !versions.includes(config.versionMap[txt])) {
        versions.push(config.versionMap[txt]);
      }
      // Source 2: image alt text. Match against the full canonical version names
      // we'd map to (e.g. "scarlet" → versionMap value "scarlet").
      for (const img of td.querySelectorAll('img')) {
        const alt = (img.getAttribute('alt') || '').toLowerCase().trim();
        if (!alt) continue;
        // Walk versionMap and accept if any value matches this alt or the alt
        // contains it (handles "Pokémon Scarlet" alt vs "scarlet" canonical).
        for (const k in config.versionMap) {
          const canonical = config.versionMap[k];
          // Match if alt equals canonical, OR alt contains canonical as a word.
          // Use simple includes to keep it forgiving.
          if (!versions.includes(canonical) &&
              (alt === canonical || alt === k.toLowerCase() ||
               alt.includes(canonical.replace('-', ' ')) ||
               alt.includes(canonical))) {
            versions.push(canonical);
          }
        }
      }
    }
    // Source 3 fallback: if we found no version info anywhere in the row,
    // attribute the row to ALL of this game's versions. Safer than dropping.
    if (versions.length === 0) {
      for (const k in config.versionMap) versions.push(config.versionMap[k]);
    }
    // Find rarity / levels — typically tds with % and digit-range
    let rarity = null, levels = null;
    for (const td of tds) {
      const txt = td.textContent.trim();
      if (/^\d+%$/.test(txt) && !rarity) rarity = txt;
      else if (/^\d+(-\d+)?$/.test(txt) && !levels) levels = txt;
    }
    outRows.push({
      pokemon: slug,
      subarea, method,
      weather: currentBiome,    // misnamed in our schema but covers weather/biome rows
      versions, rarity, levels
    });
  }
}

// ── Main scraping orchestration ─────────────────────────────────────────────
async function scrapeGame(gameKey) {
  const config = GAMES[gameKey];
  if (!config) throw new Error(`Unknown game: ${gameKey}`);
  console.log(`\n=== Scraping ${gameKey} ===`);
  const cacheGameDir = path.join(CACHE_DIR, gameKey);
  ensureDir(cacheGameDir);

  // 1. Fetch every index page (base game + DLC index pages) and merge species
  //    lists. SwSh and SV have separate DLC pages with returning species the
  //    base regional dex doesn't include (Lillipup via Isle of Armor, etc).
  const seenSlugs = new Set();
  const speciesList = [];
  for (const url of config.pokedexPages) {
    // Use a slug-safe filename for each index page so we cache them separately.
    const fname = '_index_' + url.replace(/^.*\/game\//, '').replace(/[\/]/g, '__') + '.html';
    const indexPath = path.join(cacheGameDir, fname);
    let indexHtml;
    try {
      indexHtml = await getPage(url, indexPath);
    } catch (e) {
      console.warn(`  ! could not fetch index ${url}: ${e.message}`);
      continue;
    }
    const partial = withParsedHTML(indexHtml, function(indexDoc) {
      return parseGamePokedex(indexDoc, gameKey);
    });
    let added = 0;
    for (const sp of partial) {
      if (seenSlugs.has(sp.slug)) continue;
      seenSlugs.add(sp.slug);
      speciesList.push(sp);
      added++;
    }
    console.log(`  ${url.split('/game/')[1]}: ${partial.length} on page, ${added} new`);
  }
  console.log(`  Total unique species across all pages: ${speciesList.length}`);

  // 2. For each pokémon, fetch its detail page and extract the location row.
  // We CLOSE the JSDOM window after each parse — keeping all 600 docs in memory
  // OOMs Node's default heap (~4GB).
  const speciesLocations = {};   // slug → { locations: [...], note: string }
  for (let i = 0; i < speciesList.length; i++) {
    const sp = speciesList[i];
    const pPath = path.join(cacheGameDir, 'pokemon', `${sp.slug}.html`);
    try {
      const html = await getPage(`https://pokemondb.net/pokedex/${sp.slug}`, pPath);
      speciesLocations[sp.slug] = withParsedHTML(html, function(doc) {
        return parsePokemonLocations(doc, gameKey);
      });
    } catch (e) {
      console.warn(`  ! failed ${sp.slug}: ${e.message}`);
      speciesLocations[sp.slug] = { locations: [], note: 'Scrape failed' };
    }
    if ((i + 1) % 50 === 0) console.log(`  ...processed ${i + 1}/${speciesList.length} species`);
  }

  // 3. Collect every unique location referenced and fetch each one
  const locationSet = new Set();
  for (const slug in speciesLocations) {
    for (const loc of speciesLocations[slug].locations) locationSet.add(loc.slug);
  }
  console.log(`  Found ${locationSet.size} unique locations to fetch`);
  const locationData = {};   // location-slug → array of encounter rows
  let li = 0;
  for (const locSlug of locationSet) {
    li++;
    const lPath = path.join(cacheGameDir, 'locations', `${locSlug}.html`);
    try {
      const html = await getPage(`https://pokemondb.net/location/${locSlug}`, lPath);
      locationData[locSlug] = withParsedHTML(html, function(doc) {
        return parseLocationPage(doc, gameKey);
      });
    } catch (e) {
      console.warn(`  ! location failed ${locSlug}: ${e.message}`);
      locationData[locSlug] = [];
    }
    if (li % 25 === 0) console.log(`  ...fetched ${li}/${locationSet.size} locations`);
  }

  // 4. Build the output: for each species, walk its referenced locations and
  //    pick out rows matching that species. Then map to our schema.
  const out = {
    game: gameKey,
    scrapedAt: new Date().toISOString(),
    version: 1,
    pokemon: {},
    available: [],
    notes: {}
  };
  for (const sp of speciesList) {
    const info = speciesLocations[sp.slug];
    if (!info) continue;
    if (info.note && !info.locations.length) {
      out.notes[sp.slug] = info.note;
      // If the note is "Not available", we treat the species as NOT in this game.
      // Otherwise (Trade/migrate, Evolve, etc.) it IS available, just not catchable
      // in the wild — we still add it to available so the dex shows it.
      if (!/^Not available/i.test(info.note)) out.available.push(sp.slug);
      continue;
    }
    const records = [];
    for (const locRef of info.locations) {
      const rows = locationData[locRef.slug] || [];
      for (const r of rows) {
        if (r.pokemon !== sp.slug) continue;
        records.push({
          location: locRef.name,
          locationSlug: locRef.slug,
          method: r.method,
          weather: r.weather,
          rarity: r.rarity,
          levels: r.levels,
          versions: r.versions,
          subarea: r.subarea
        });
      }
    }
    if (records.length) {
      out.pokemon[sp.slug] = records;
      out.available.push(sp.slug);
    } else if (info.locations.length) {
      // Has location links but no matching encounter rows — likely a special encounter
      // (gift, fossil, raid den) we'll surface as a note.
      out.notes[sp.slug] = 'Special encounter — see ' + info.locations.map(l => l.name).join(', ');
      out.available.push(sp.slug);
    } else {
      // Catch-all: species was in the game's pokédex listing (so it IS in this
      // game) but the per-pokémon page parser couldn't find structured info.
      // Still add to available — the species exists in this game even if we
      // couldn't extract its encounter details. Log a generic note so the user
      // knows it's data we don't have rather than missing entirely.
      out.notes[sp.slug] = info.note || 'Encounter data not available';
      out.available.push(sp.slug);
    }
  }

  // 5. Write output
  ensureDir(OUTPUT_DIR);
  const outPath = path.join(OUTPUT_DIR, `${gameKey}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  // Also write a .js shim that registers this game's data on a global,
  // because the Android WebView loads data via <script> tags rather than
  // fetch() (file:// fetches are inconsistent across WebView versions).
  const jsPath = path.join(OUTPUT_DIR, `${gameKey}.js`);
  fs.writeFileSync(jsPath,
    `window.CATCH_DATA = window.CATCH_DATA || {};\n` +
    `window.CATCH_DATA['${gameKey}'] = ${JSON.stringify(out)};\n`);
  console.log(`  ✓ wrote ${outPath}`);
  console.log(`    available: ${out.available.length} species`);
  console.log(`    with encounters: ${Object.keys(out.pokemon).length} species`);
  console.log(`    notes: ${Object.keys(out.notes).length} species`);
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args[0] === '--help') {
    console.log('Usage:');
    console.log('  node scrape-catchability.js <game-id> [<game-id> ...]');
    console.log('  node scrape-catchability.js --all');
    console.log('  node scrape-catchability.js --test <game-id> <pokemon-slug>');
    console.log('       Validates parsing on a single cached page and prints what was extracted.');
    console.log('       Run a normal scrape first to populate the cache.');
    console.log('Available games: ' + Object.keys(GAMES).join(', '));
    process.exit(0);
  }
  // Test mode — useful for iterating on the parser without re-running a full scrape.
  if (args[0] === '--test' || args[0] === '--test-loc') {
    const isLoc = args[0] === '--test-loc';
    const gameKey = args[1];
    const slug = args[2];
    if (!gameKey || !slug) {
      console.error(`Usage: ${args[0]} <game-id> <${isLoc ? 'location' : 'pokemon'}-slug>`);
      process.exit(1);
    }
    const cachePath = isLoc
      ? path.join(CACHE_DIR, gameKey, 'locations', `${slug}.html`)
      : path.join(CACHE_DIR, gameKey, 'pokemon', `${slug}.html`);
    console.log(`Looking for cached page at:\n  ${cachePath}`);
    if (!fs.existsSync(cachePath)) {
      console.error(`\nFile not found.`);
      const gameDir = path.join(CACHE_DIR, gameKey);
      if (fs.existsSync(gameDir)) {
        console.error(`\nContents of ${gameDir}:`);
        for (const f of fs.readdirSync(gameDir)) console.error('  ' + f);
        const subDir = path.join(gameDir, isLoc ? 'locations' : 'pokemon');
        if (fs.existsSync(subDir)) {
          const files = fs.readdirSync(subDir);
          console.error(`\n${subDir} has ${files.length} files. First 5:`);
          for (const f of files.slice(0, 5)) console.error('  ' + f);
        }
      }
      process.exit(1);
    }
    const html = fs.readFileSync(cachePath, 'utf8');
    const doc = parseHTML(html);
    if (isLoc) {
      const rows = parseLocationPage(doc, gameKey);
      console.log(`Parsed ${rows.length} encounter rows from ${slug}:`);
      for (const r of rows.slice(0, 25)) console.log('  ', JSON.stringify(r));
      if (rows.length > 25) console.log(`  ...+${rows.length - 25} more`);
      // Also dump section headings so we can see what subareas/methods exist on the page
      console.log('\nSection structure (h2/h3):');
      for (const el of doc.querySelectorAll('h2, h3')) {
        console.log(`  ${el.tagName}: ${el.textContent.trim()}`);
      }
    } else {
      const result = parsePokemonLocations(doc, gameKey);
      console.log(`Parsed locations for ${slug} in ${gameKey}:`);
      console.log(JSON.stringify(result, null, 2));
      const tbl = findLocationTable(doc);
      console.log(`\nLocation table found: ${!!tbl}`);
      if (tbl) {
        console.log(`Table has ${tbl.querySelectorAll('tr').length} rows. Headers:`);
        for (const tr of tbl.querySelectorAll('tr')) {
          const ths = tr.querySelectorAll('th');
          if (ths.length) console.log('  TH:', Array.from(ths).map(t => t.textContent.trim()).join(' | '));
        }
      }
    }
    process.exit(0);
  }
  const targets = args[0] === '--all' ? Object.keys(GAMES) : args;
  for (const g of targets) {
    try {
      await scrapeGame(g);
    } catch (e) {
      console.error(`Failed ${g}: ${e.message}`);
      console.error(e.stack);
    }
  }
  // Refresh manifest by listing all output files. The app reads this on launch
  // and uses it to know which games have curated catch data, plus to detect
  // updates when "Check for updates" is pressed.
  ensureDir(OUTPUT_DIR);
  const all = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
  const manifest = {
    version: Date.now(),    // monotonic version stamp; increases each scrape
    generatedAt: new Date().toISOString(),
    games: {}
  };
  for (const f of all) {
    const data = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf8'));
    manifest.games[data.game] = {
      file: f,
      scrapedAt: data.scrapedAt,
      pokemonCount: Object.keys(data.pokemon).length,
      availableCount: data.available.length
    };
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.js'),
    `window.CATCH_MANIFEST = ${JSON.stringify(manifest)};\n`);
  console.log(`\nManifest: ${all.length} games, version ${manifest.version}`);
}

main();
