#!/usr/bin/env node
// scrape-bosses.js — pulls Gym Leader / Elite Four / Champion data from pokemondb.net
// for every main-series game and outputs `app/src/main/assets/bosses.json`.
//
// Usage:  node scripts/scrape-bosses.js
//
// Reads from `scripts/cache/<gameId>.md` if a cached markdown extract exists,
// otherwise fetches the live HTML page and runs a best-effort HTML→Markdown
// shim before parsing.
//
// You can pre-populate the cache with markdown-flavoured page extracts (one
// `<gameId>.md` per game) — that's how this tool is run from this codebase
// since the build sandbox lacks direct access to pokemondb.net. Caching also
// makes subsequent runs deterministic and offline.
//
// No external dependencies — uses native fetch (Node 18+).

const fs = require('fs');
const path = require('path');

const GAMES = [
  // Gen 1
  {id:'red-blue',                 url:'red-blue/gymleaders-elitefour'},
  {id:'yellow',                   url:'yellow/gymleaders-elitefour'},
  // Gen 2
  {id:'gold-silver',              url:'gold-silver/gymleaders-elitefour'},
  {id:'crystal',                  url:'crystal/gymleaders-elitefour'},
  // Gen 3
  {id:'ruby-sapphire',            url:'ruby-sapphire/gymleaders-elitefour'},
  {id:'emerald',                  url:'emerald/gymleaders-elitefour'},
  {id:'firered-leafgreen',        url:'firered-leafgreen/gymleaders-elitefour'},
  // Gen 4
  {id:'diamond-pearl',            url:'diamond-pearl/gymleaders-elitefour'},
  {id:'platinum',                 url:'platinum/gymleaders-elitefour'},
  {id:'heartgold-soulsilver',     url:'heartgold-soulsilver/gymleaders-elitefour'},
  // Gen 5
  {id:'black-white',              url:'black-white/gymleaders-elitefour'},
  {id:'black-2-white-2',          url:'black-white-2/gymleaders-elitefour'},
  // Gen 6
  {id:'x-y',                      url:'x-y/gymleaders-elitefour'},
  {id:'omega-ruby-alpha-sapphire',url:'omega-ruby-alpha-sapphire/gymleaders-elitefour'},
  // Gen 7
  {id:'sun-moon',                 url:'sun-moon/kahunas-elitefour'},
  {id:'ultra-sun-ultra-moon',     url:'ultra-sun-ultra-moon/kahunas-elitefour'},
  {id:'lets-go-pikachu-lets-go-eevee', url:'lets-go-pikachu-eevee/gymleaders-elitefour'},
  // Gen 8
  {id:'sword-shield',             url:'sword-shield/gymleaders'},
  {id:'brilliant-diamond-and-shining-pearl', url:'brilliant-diamond-shining-pearl/gymleaders-elitefour'},
  // Gen 9
  {id:'scarlet-violet',           url:'scarlet-violet/gymleaders-elitefour'}
];

const BASE = 'https://pokemondb.net/';
const CACHE_DIR = path.resolve(__dirname, 'cache');

async function fetchPage(url, gameId){
  const cachePath = path.join(CACHE_DIR, gameId + '.md');
  if(fs.existsSync(cachePath)) return fs.readFileSync(cachePath, 'utf8');
  const r = await fetch(url, {
    headers:{
      'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language':'en-US,en;q=0.5'
    }
  });
  if(!r.ok) throw new Error('HTTP '+r.status+' for '+url);
  const html = await r.text();
  const md = htmlToMd(html);
  if(!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, {recursive:true});
  fs.writeFileSync(cachePath, md);
  return md;
}

// Quick HTML→Markdown shim: keep links as `[text](href)` and images as `![alt](src)`,
// drop other tags, normalise whitespace. Sufficient for our trainer pages.
function htmlToMd(html){
  return html
    .replace(/<script[\s\S]*?<\/script>/gi,'')
    .replace(/<style[\s\S]*?<\/style>/gi,'')
    .replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,'[$2]($1)')
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi,'![$1]($2)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi,'![$2]($1)')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi,'\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi,'\n### $1\n')
    .replace(/<br\s*\/?>/gi,'\n')
    .replace(/<\/p>/gi,'\n')
    .replace(/<[^>]+>/g,'')
    .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"')
    .replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n');
}

// ── Markdown parser ────────────────────────────────────────────────────────
function classifySection(heading){
  let m;
  if((m = heading.match(/^Gym\s*#(\d+)(?:,\s*(.+))?$/i)))
    return {role:'gym', n:parseInt(m[1],10), city:m[2]?m[2].trim():null};
  if((m = heading.match(/^(?:Grand\s+)?Trial\s*#(\d+)(?:,\s*(.+))?$/i)))
    return {role:'gym', n:parseInt(m[1],10), city:m[2]?m[2].trim():null};
  if((m = heading.match(/^Elite\s+Four\s*#(\d+)$/i)))
    return {role:'e4', n:parseInt(m[1],10)};
  if(/^Champion(?:s)?$/i.test(heading)) return {role:'champion'};
  return null;
}

function parsePage(md){
  const sections = [];
  const re = /^##\s+(.+)$/gm;
  let match;
  const positions = [];
  while((match = re.exec(md))){
    positions.push({heading: match[1].trim(), start: match.index, contentStart: match.index + match[0].length});
  }
  for(let i=0;i<positions.length;i++){
    const cur = positions[i];
    const end = i+1 < positions.length ? positions[i+1].start : md.length;
    sections.push({heading: cur.heading, body: md.slice(cur.contentStart, end)});
  }

  const trainers = [];
  for(const s of sections){
    const cls = classifySection(s.heading);
    if(!cls) continue;
    const blocks = splitTrainerBlocks(s.body);
    for(const b of blocks){
      const trainer = parseTrainerBlock(b);
      if(!trainer) continue;
      if(trainer.isRematch) continue;
      if(!trainer.team || !trainer.team.length) continue;
      trainers.push({...cls, ...trainer});
    }
  }
  return trainers;
}

function splitTrainerBlocks(body){
  const lines = body.split('\n');
  const blocks = [];
  let cur = null;
  for(const line of lines){
    // Trainer sprites have URLs that contain `/sprites/trainers/`.
    // Pokémon sprites have URLs containing `/sprites/<game>/normal/` or `/sprites/home/normal/`,
    // and they appear inside link wrappers `[![…](sprite-url)](/pokedex/slug)`.
    const m = line.match(/!\[([^\]]+)\]\(([^)]*\/sprites\/trainers\/[^)]+)\)/);
    if(m && !line.includes('/pokedex/')){
      // Standalone trainer sprite — start of a new trainer block.
      if(cur) blocks.push(cur);
      cur = {spriteName: m[1], lines: [line]};
    } else if(cur){
      cur.lines.push(line);
    }
  }
  if(cur) blocks.push(cur);
  return blocks;
}

function parseTrainerBlock(b){
  const lines = b.lines.map(l=>l.trim()).filter(l=>l.length>0);
  if(lines.length < 2) return null;

  // Header lines come BEFORE the first Pokémon row.
  // A Pokémon row is identified by a `/pokedex/` link.
  const headerLines = [];
  const teamLines = [];
  let inTeam = false;
  for(let i=1;i<lines.length;i++){
    const line = lines[i];
    if(/\/pokedex\//.test(line)) inTeam = true;
    (inTeam ? teamLines : headerLines).push(line);
  }

  // ── Header ──
  let name = null, variant = null, badge = null, type = null, isRematch = false;
  for(const h of headerLines){
    if(/^!\[/.test(h)) continue;     // skip image-only lines
    const t = h.trim();
    if(!t) continue;
    if(!name){
      let nm = t;
      if(/-\s*rematch\b/i.test(nm)){isRematch = true; nm = nm.replace(/-\s*rematch\b/i,'').trim();}
      name = nm;
      continue;
    }
    if(/^\(.+\)$/.test(t)){variant = t.replace(/^\(|\)$/g,''); continue;}
    if(/^[A-Za-z]+\s+Badge$/.test(t)){badge = t; continue;}
    let m;
    if((m = t.match(/^([A-Za-z]+)\s+type\s+Pokémon$/i))){type = m[1].toLowerCase(); continue;}
    if(/^Mixed\s+types?$/i.test(t)){type = 'mixed'; continue;}
  }
  if(!name) return null;

  // ── Team ──
  // Scan team lines and group every 4 logical units into one Pokémon record.
  // Pattern per Pokémon (after markdown shim):
  //   line A: [![Sprite](sprite-url)](/pokedex/<slug>)#NNN
  //   line B: [Name](/pokedex/<slug>)
  //   line C: Level NN
  //   line D: [Type](/type/<t1>) [· [Type2](/type/<t2>)]
  //
  // BUT some entries have a form/variant line (e.g. "Galarian Yamask") between B and C.
  // Strategy: walk linearly, collecting the LAST seen /pokedex/slug, the level, and types,
  // flushing on each `Level NN` followed by a `/type/...` line.
  const team = [];
  let curSlug = null;
  let curLevel = null;
  let curTypes = [];
  let sawLevel = false;
  function flush(){
    if(curSlug && curLevel != null){
      team.push({n: curSlug, l: curLevel, t1: curTypes[0]||null, t2: curTypes[1]||null});
    }
    curSlug = null; curLevel = null; curTypes = []; sawLevel = false;
  }
  for(const t of teamLines){
    const slugMatch = [...t.matchAll(/\/pokedex\/([a-z0-9-]+)/gi)];
    const lvMatch = t.match(/Level\s+(\d+)/i);
    const typeMatches = [...t.matchAll(/\/type\/([a-z]+)/gi)];

    if(slugMatch.length){
      // Each pokedex link line refers to the same Pokémon (sprite link + text link both name it).
      // If we already have types for the previous Pokémon, flushing happens below on type line.
      // If we've already seen a level for the previous one but no types yet, that's odd — flush.
      if(sawLevel && typeMatches.length === 0){
        flush();
      }
      // Track the latest slug — overrides only if we don't yet have one for the current entry.
      if(!curSlug || sawLevel === false && curLevel === null){
        curSlug = slugMatch[slugMatch.length-1][1];
      } else if(!curSlug){
        curSlug = slugMatch[slugMatch.length-1][1];
      }
    }
    if(lvMatch){
      curLevel = parseInt(lvMatch[1],10);
      sawLevel = true;
    }
    if(typeMatches.length){
      for(const tm of typeMatches){
        if(curTypes.length<2) curTypes.push(tm[1].toLowerCase());
      }
      // Type line completes the Pokémon record
      if(curSlug && curLevel != null) flush();
    }
  }
  flush();

  return {name, variant, badge, type, isRematch, team};
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main(){
  if(!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, {recursive:true});

  const allRecords = [];
  for(const game of GAMES){
    const url = BASE + game.url;
    process.stderr.write(`Parsing ${game.id}… `);
    let md;
    try {
      md = await fetchPage(url, game.id);
    } catch(e) {
      process.stderr.write(`FAILED (${e.message})\n`);
      continue;
    }
    const trainers = parsePage(md);
    for(const t of trainers){
      allRecords.push({gameId: game.id, ...t});
    }
    process.stderr.write(`${trainers.length} entries\n`);
    await new Promise(r=>setTimeout(r, 200));
  }

  // ── Merge identical rosters across games ────────────────────────────────
  const merged = new Map();
  for(const r of allRecords){
    const teamSig = r.team.map(p=>`${p.n}:${p.l}`).join(',');
    const key = `${r.role}|${r.n||''}|${r.name}|${r.variant||''}|${teamSig}`;
    if(merged.has(key)){
      const e = merged.get(key);
      if(!e.games.includes(r.gameId)) e.games.push(r.gameId);
    } else {
      merged.set(key, {
        id:    `${r.gameId}-${r.role}-${r.n||''}-${r.name}`.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''),
        games: [r.gameId],
        role:  r.role,
        n:     r.n,
        name:  r.name,
        variant: r.variant,
        city:  r.city,
        badge: r.badge,
        type:  r.type,
        team:  r.team
      });
    }
  }
  const out = Array.from(merged.values());

  const ROLE_ORDER = {gym:0, e4:1, champion:2};
  const GAME_ORDER = Object.fromEntries(GAMES.map((g,i)=>[g.id, i]));
  out.sort((a,b)=>{
    const ag = Math.min(...a.games.map(g=>GAME_ORDER[g] ?? 999));
    const bg = Math.min(...b.games.map(g=>GAME_ORDER[g] ?? 999));
    if(ag!==bg) return ag-bg;
    if(ROLE_ORDER[a.role]!==ROLE_ORDER[b.role]) return ROLE_ORDER[a.role]-ROLE_ORDER[b.role];
    return (a.n||0)-(b.n||0);
  });

  const outPath = path.resolve(__dirname, '../app/src/main/assets/bosses.js');
  // Wrap as a JS module — defines `var BOSSES` so the app can load it via <script src>.
  // We do this instead of writing JSON because Android WebView blocks fetch() from
  // file:// URLs on modern API levels, but <script src> works fine.
  const js = '// Auto-generated by scripts/scrape-bosses.js — do not edit by hand.\n'
           + '// Source: pokemondb.net\n'
           + 'var BOSSES = ' + JSON.stringify(out, null, 1) + ';\n';
  fs.writeFileSync(outPath, js);
  console.log(`\nWrote ${out.length} boss entries to ${outPath}`);
}

main().catch(e=>{console.error(e);process.exit(1);});
