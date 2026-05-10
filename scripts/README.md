# PokéGuide data scrapers

Two scrapers, both pulling from [pokemondb.net](https://pokemondb.net/):

- **`scrape-bosses.js`** — Gym Leaders, Elite Four, and Champions for every main-series game. Output: `app/src/main/assets/bosses.js`.
- **`scrape-catchability.js`** — Per-pokémon catchability data (location, method, weather, rarity, level range) for Gen 8/9 games where PokéAPI's encounter data is incomplete or absent. Output: one JSON file per game in `app/src/main/assets/data/catch/`.

## One-time setup

```bash
cd scripts
npm install
```

This installs `jsdom` (used by the catchability scraper).

## Running

### Bosses

```bash
node scripts/scrape-bosses.js
```

Requires Node 18+. No arguments. Refreshes `bosses.js` from cached/live PokémonDB pages.

### Catchability

```bash
# One game
node scripts/scrape-catchability.js sword-shield

# All supported games (Sword/Shield, BDSP, Legends Arceus, Scarlet/Violet, Let's Go P/E)
node scripts/scrape-catchability.js --all
```

Each game produces `app/src/main/assets/data/catch/<game-id>.json`. A `manifest.json` in the same directory lists all available games and their scrape timestamps.

The scraper is **incremental and resumable**: every fetched HTML page is cached in `scripts/cache/catch/<game-id>/`. Re-running uses the cache. To force a re-fetch of a specific page, delete its cache file. To force a full rescrape of a game, delete that game's cache directory.

Expect each game to take **30-90 minutes** for an initial scrape (~600-700 species + ~100-200 location pages, with a 1.2-second polite delay between requests). Subsequent runs are near-instant from cache.

## Output schema (catchability)

```json
{
  "game": "sword-shield",
  "scrapedAt": "2026-04-28T...",
  "version": 1,
  "pokemon": {
    "lillipup": [
      {
        "location": "Training Lowlands",
        "locationSlug": "galar-training-lowlands",
        "method": "Walking",
        "weather": "Normal Weather",
        "rarity": "60%",
        "levels": "16-21",
        "versions": ["sword", "shield"],
        "subarea": "Main"
      }
    ]
  },
  "available": ["lillipup", "blipbug"],
  "notes": {
    "magearna": "Mystery Gift only"
  }
}
```

`available` is the list of every pokémon catchable in this game (used by the in-app dex filter for accuracy). `pokemon` contains detailed encounter records. `notes` covers special cases (gift, fossil, trade-only, etc.).

## App integration

The app reads `manifest.json` and the per-game JSONs at runtime. See `index.html` → search for `loadCatchData` for the loader.

## Troubleshooting

**Empty location data for some pokémon** — PokémonDB sometimes uses non-standard table layouts for special locations (raid dens, fossils, gifts). These end up as `notes` rather than `pokemon` records. Spot-check the cached HTML in `scripts/cache/catch/<game>/locations/<slug>.html` to confirm.

**HTTP 403 / rate limit** — your IP got rate-limited. Wait an hour, or run from a different network. The scraper has a 1.2-second polite delay built in but bursts of 1000+ requests will still trip rate limits sometimes.

**Wrong gen detected** — the location page parser hardcodes `targetGen` per game. If a future update to PokémonDB changes generation labels, edit the `targetGen` mapping inside `parseLocationPage`.
