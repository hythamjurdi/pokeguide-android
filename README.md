# PokéGuide

A beautifully designed Pokémon companion app for Android. Originally built for the [AYN Thor](https://www.aynstore.com/products/thor) handheld's bottom screen, but runs on any Android 7.0+ device.

Data pulled live from [PokéAPI](https://pokeapi.co) + bundled curated encounter data scraped from [PokémonDB](https://pokemondb.net).

---

## 📥 Download

**[⬇️ Download the latest APK](https://github.com/hythamjurdi/pokeguide-android/releases/latest)**

Or grab it from the [Releases](https://github.com/hythamjurdi/pokeguide-android/releases) page.

### How to install

1. Download `PokeGuide-v1.4.0.apk` from the link above
2. On your Android device, go to **Settings → Security** (or **Apps → Special access**) and allow installation from unknown sources for your browser/file manager
3. Tap the downloaded APK file and follow the prompts
4. Open **PokéGuide** from your app drawer — look for the red Pokéball icon

> **Upgrading from a previous version?** Just install the new APK — Android will update the existing app and keep your settings and progress data.

---

## ✨ Features

### 🏠 Launchpad

The home screen puts everything one tap away:

- **Favorites showcase** — up to 5 favorite Pokémon displayed as trophies on pokéball circle backdrops in a frosted glass container
- **Pinned game strip** — "Currently Playing" with game badge, name, and completion %
- **Pinned guide card** — one-tap access to your active walkthrough
- **Pokédex hero tile** — stylized pokéball design. Tap to jump straight into the full 1,025-species Pokédex.
- **Square tile grid** — Bosses, Locations, Moves, and TM & HM with clean white-outlined icons
- **Glass Progress tile** — frosted dark surface with a live completion ring
- **Guides tile** — shows saved guide count, tap to manage all bookmarks
- **Bottom list** — Compare, Type Chart, and Items

### 📚 Guide Browser

Save bookmarks to any walkthrough, wiki, or guide page and browse them in-app:

- In-app browser overlay with back navigation, pinch zoom, and auto-hiding toolbar
- **Resume scroll** — reopens exactly where you left off, even across app restarts
- Pin one guide to the launchpad for instant access
- Icon picker with 4 tabs: game badges, Pokémon sprites, color gradients, custom upload
- Organize guides by game group (official games or custom ROM hack names)
- Ad-hiding CSS injected automatically on wiki sites
- Third-party cookies enabled for Cloudflare-protected sites (Bulbapedia)

### 🔴 Pokédex

- Browse all **1,025 Pokémon** across all 9 generations
- **List and grid views** — grid uses frosted-glass cells in fancy mode with subtle highlight rings and press-down scale animation
- Official sprites, Pokédex numbers, and names
- Fast search by name or Pokédex number with a one-tap clear button
- Paginated with configurable items per page (50, 100, 200, 300, 500, or All)

### 📖 Pokémon Detail View

- Full-bleed gradient hero using the Pokémon's type colors
- **Type-color atmospheric backdrop** flows down the entire page in fancy mode
- **High-resolution official artwork** with normal/shiny toggle
- **Compare button** — tap to compare with any other Pokémon side-by-side
- **Info tab** — flavor text, base stat bars, type matchups, abilities with descriptions, height/weight, catch rate, generation, legendary status
- **Evolution tab** — every stage with sprites and accurate requirements (level, stone, trade, friendship, held item, time of day, location, etc.)
- **Forms strip** — all variant forms (Alolan, Galarian, Hisuian, Paldean, Mega, etc.) as switchable sprite thumbnails
- **Catch tab** — catch rate, happiness, growth rate, egg groups, plus **curated encounter data** for 9 games
- **Moves tab** — full move list with power, accuracy, type, damage category. Tap any move for a detail popup with effect description and PP.
- **⭐ Favorite button** — add to your launchpad showcase (up to 5)

### ⚖️ Pokémon Comparison

- Compare any two Pokémon side-by-side
- **Type effectiveness indicator** — sword icon shows which Pokémon has the advantage
- **Independent slot swapping** — tap either side to replace just that Pokémon
- **Filter panel** — narrow the picker by type, generation, or category (Legendary/Mythical/Starters)
- Dedicated picker with grid/list toggle
- Three comparison tabs:
  - **Stats** — base stat bars with winners highlighted, totals, height/weight, abilities
  - **Type** — type pills + defensive matchups (Immune / Weak / Resists)
  - **Moves** — shared moves first, then unique to each (filtered by game)

### 📊 Progress Checker

Track your playthrough across any game:

- **Game picker** with "In Progress" section (games you're actively playing) + "All Games"
- **Dashboard** per game with completion certificates, What's Next boss card, Pokédex/Bosses/Wanted cards
- **Pokédex checklist** — 5-column grid, multi-select with floating action bar (Caught / Shiny / Wanted / ✕)
- **Shiny auto-marks caught** — toggling shiny ON automatically marks the Pokémon as caught
- **Boss tracker** — mark gym leaders, kahunas, E4, and champions as beaten. Includes accurate team data scraped from PokémonDB.
- **Wanted list** — tap ♡ on any Pokémon to add it to your wishlist
- **Celebrations** — gold confetti on dex completion, blue confetti on beating the Champion
- **Pin to Launchpad** — surface your active playthrough's progress ring on the home screen
- **In-Progress toggle** — mark/unmark games as active playthroughs
- **Reset** — clear all progress for a game with a confirmation modal

### 🏆 Bosses

Full boss data for every main-series game, scraped from PokémonDB:

- **Gym Leaders** — all 8 per game (10 for SwSh version-exclusives), with badges and cities
- **Trial Captains** — Ilima, Lana, Kiawe, Mallow, Sophocles, Acerola, Mina for SM/USUM
- **Team Star Bosses** — Giacomo, Mela, Atticus, Ortega, Eri for Scarlet/Violet
- **Island Kahunas** — Hala, Olivia, Nanu, Hapu for SM/USUM
- **Elite Four** — all 4 members per game with full team data
- **Champions** — Leon (SwSh), Cynthia (DP/Pt/BDSP), Kukui (SM), Hau (USUM), Blue (RB/Y/FRLG), Lance (GSC/HGSS), and all others
- **Kanto post-game gyms** — Crystal and HGSS include all 16 gym leaders (8 Johto + 8 Kanto)
- Boss detail view with full team, types, levels, and sprites
- Sorted by progression order (Gyms → Kahunas → E4 → Champion)
- Previous/next navigation between bosses

### 🗺️ Locations

- Browse locations by region, filtered by active game
- **Curated encounter data** for 9 games (BW, BW2, XY, ORAS, LGPE, SwSh, BDSP, Legends Arceus, SV) — tap a location to see every catchable Pokémon there with method, rarity %, and level range
- **Game-aware filtering** — selecting a game narrows to that game's region and shows only encounters from that game's versions
- Falls back to PokéAPI encounter data for Gen 1-7 games

### 📦 Offline Mode

- **IndexedDB-based cache** — Pokémon data, sprites, and artwork stored locally for offline access
- **Bulk download** — download all 1,025 Pokémon's data + sprites in one go (resumable, cancellable)
- Estimated ~650-750 MB for full offline coverage (includes variant sprites)
- **Check for Updates** — compares live PokéAPI count to cached data
- **No-connection fallback** — shows cached data when offline, fallback dex list when index fails
- Manage cache from Settings → Offline Data

### 🔮 Type Chart

- Full interactive 18×18 type effectiveness matrix
- Toggle between Attacking and Defending views
- Color-coded cells

### 🎮 Global Game Filter

- Tap the game badge in any top bar to open the picker
- **21 game versions**, from Red/Blue through Scarlet/Violet
- Affects Pokédex filtering, encounter data, boss lists, location regions, and move lists
- Starts on "All" each session — no stale filter from a previous playthrough

### ⚙️ Settings

- Dark / Light theme
- Fancy / Simple graphics (toggle the glass effects on or off)
- Items per page (50, 100, 200, 300, 500, or All)
- Offline data management
- All settings saved between sessions

### 🎨 Liquid Glass UI

- Frosted-glass top bars, bottom nav, cards, modals, and pagination buttons
- Type-color atmospheric backdrops on detail pages
- Frosted grid cells in Pokédex grid view
- Glass progress tile on launchpad
- Soft fade-out gradients for seamless blending
- Performance-tuned: scroll-heavy areas skip per-row blur

---

## 📱 Designed for the AYN Thor

The AYN Thor is an Android handheld with a 1080×1920 bottom screen. PokéGuide was built from the ground up with that form factor in mind: compact layouts, touch targets sized for thumb use, fullscreen immersive mode, and landscape-friendly. But everything scales nicely — it works just as well on a phone or tablet.

---

## 🙏 Credits

- Built with the assistance of [Claude](https://claude.ai) by Anthropic
- Pokémon data: [PokéAPI](https://pokeapi.co)
- Boss & encounter data: [PokémonDB](https://pokemondb.net)
- Sprites & official artwork: [PokéAPI/sprites](https://github.com/PokeAPI/sprites)
- Pokémon © Nintendo / Creatures Inc. / GAME FREAK Inc.

This is a non-commercial fan project. All Pokémon names, images, and data are property of their respective owners.

---

## 📄 License

[MIT](LICENSE)

---

<details>
<summary><strong>🔨 Building from source</strong> (for developers)</summary>

Requires **Android Studio** (Hedgehog or newer).

1. Clone the repo:
   ```bash
   git clone https://github.com/hythamjurdi/pokeguide-android.git
   ```
2. Open the project in Android Studio and let Gradle sync
3. Select the `release` build variant: **Build → Select Build Variant** → `release`
4. Build the APK: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. The APK will be at `app/build/outputs/apk/release/PokeGuide-v1.4.0.apk`

The release build is signed with the standard Android debug keystore for easy local installs.

### Tech stack

| Layer        | Tech                                                          |
| ------------ | ------------------------------------------------------------- |
| **Android**  | Java, native WebView, single `MainActivity`                   |
| **Frontend** | Pure vanilla JavaScript, HTML, CSS (one file)                 |
| **Styling**  | CSS custom properties + `backdrop-filter` glass               |
| **Storage**  | `localStorage` for settings/progress, `IndexedDB` for cache  |
| **Data**     | [PokéAPI](https://pokeapi.co) (live) + bundled JSON (scraped) |
| **Scrapers** | Node.js + jsdom — `scripts/scrape-bosses.js` and `scripts/scrape-catchability.js` |
| **Build**    | Gradle 8.0, AGP 8.1, minSdk 24, targetSdk 34                 |

No npm, no webpack, no React, no build step for the frontend — just open `app/src/main/assets/index.html` in a browser and it works.

### Data files

Boss and encounter data are bundled with the app and **do not need to be regenerated** between builds. The scrapers only need to be re-run if you want to refresh data from the source sites.

| File | Description |
| ---- | ----------- |
| `assets/bosses.js` | 248 bosses: gym leaders, trial captains, team star, kahunas, E4, champions |
| `assets/data/catch/*.js` | Per-game encounter data (9 games: BW, BW2, XY, ORAS, LGPE, SwSh, BDSP, LA, SV) |
| `assets/data/catch/manifest.js` | Index of available curated games |

See [`scripts/README.md`](scripts/README.md) for scraper documentation.

</details>

---

## 📝 Changelog

### v1.4.0 — *Latest*

Guides, favorites, variant forms, filters, expanded data coverage, and offline reliability.

**📚 Guide Browser**
- Save bookmarks to any walkthrough or wiki page (Bulbapedia, Serebii, PokémonDB, ROM hack guides, etc.)
- In-app browser overlay with back navigation, pinch zoom, and auto-hiding toolbar
- **Resume scroll** — closes and reopens exactly where you left off, even across app restarts
- Pin a guide to the launchpad for one-tap access
- Icon picker (game badges, Pokémon sprites, color gradients, or custom image upload)
- Organize by game group — official games or custom ROM hack names
- Ad-hiding CSS injected on wiki pages

**⭐ Favorites Showcase**
- Pin up to 5 favorite Pokémon displayed as trophies on the launchpad
- Official artwork on pokéball circle backdrops inside a frosted glass container
- Tap to jump to that Pokémon's detail view
- ★ button on the detail view hero — slot picker when all 5 are full

**🔄 Variant Forms**
- Alolan, Galarian, Hisuian, Paldean, Mega, and all other alternate forms
- Forms strip in the detail view — horizontal row of sprite thumbnails, tap to switch
- Variant name styled with accent-colored suffix (e.g. "Ponyta **Galarian**")
- Variants searchable in the Pokédex (type "alola", "mega", "galar", etc.)

**🔍 Filter Panels**
- Pokédex + Compare: filter by **Type** (18 types), **Generation** (1-9), **Category** (Legendary, Mythical, Starters)
- Moves tab: filter by **Type** and **Category** (Physical, Special, Status)
- Filters combine with search and game filter
- Blue dot indicator on the filter button when active

**⚖️ Compare Improvements**
- Type effectiveness sword icon — shows which Pokémon has the advantage (×2 or ×4)
- Independent slot swapping — tap either side to replace just that Pokémon
- Filter panel available in the compare picker

**📖 Expanded Data**
- Curated catch data now covers **9 games**: Black/White, Black 2/White 2, X/Y, Omega Ruby/Alpha Sapphire, Let's Go, Sword/Shield, BDSP, Legends Arceus, Scarlet/Violet
- 248 bosses — added SM/USUM Trial Captains (14) and SV Team Star bosses (5)
- Ability descriptions on the Info tab (fetched from PokéAPI)
- X/Y dex filter fixed: shows all ~457 Kalos species (was 150)
- Move detail popup — tap any move from a Pokémon's move list to see power, accuracy, PP, type, category, and effect description

**📦 Offline Mode Fixes**
- Fixed trailing-slash cache key mismatch that made detail views fail offline
- Throttled IDB reads (max 6 concurrent) to prevent database overload
- Fallback dex list builder when index fetch fails
- 404s on missing variant sprites no longer count as errors
- Check for Updates button — compares live PokéAPI count to cached data
- Download state persists — shows "✓ Downloaded" with date after completion

**🎮 Navigation & Polish**
- Swipe-back gesture navigates the full UI stack instead of exiting the app
- Grid view is now the default everywhere
- Glass alert popups replace ugly browser `alert()` dialogs

### v1.3.0

The biggest update yet — a full Progress Checker, offline mode, curated encounter data for Gen 8/9, boss data for every game, a redesigned launchpad, and dozens of accuracy and polish fixes.

**📊 Progress Checker**
- Track your playthrough for any of the 21 supported games
- Per-game dashboard with Pokédex completion, boss progress, and wanted list cards
- Catch checklist with 5-column grid view and multi-select floating action bar (Caught / Shiny / Wanted)
- Shiny toggle automatically marks as caught — you can't have a shiny you haven't caught
- Boss tracker with accurate team data for every gym leader, kahuna, E4 member, and champion
- Wanted list — tap ♡ on any Pokémon to wishlist it
- Gold confetti celebration on dex completion, blue confetti on beating the Champion
- "In Progress" toggle pins games to the top of the game picker
- "Pin to Launchpad" toggle surfaces your active game's progress ring on the home screen
- Reset with glass confirmation modal

**🏆 Boss data for all games**
- Scraped from PokémonDB with full team data (Pokémon, types, levels)
- 248 bosses across 20 games
- Island Kahunas (Hala, Olivia, Nanu, Hapu) added for Sun/Moon and Ultra Sun/Ultra Moon with correct per-game teams
- Champion Leon added for Sword & Shield with full 6-Pokémon team
- Fixed duplicate champion entries (Blue appeared 3x in some games — now 1x)
- Fixed boss ordering (BDSP had E4 members mixed in with gym leaders)
- Sorted by progression: Gyms → Kahunas → Elite Four → Champion

**🗺️ Curated encounter data (Gen 8/9)**
- Scraped from PokémonDB for Sword/Shield, Brilliant Diamond/Shining Pearl, Legends: Arceus, Scarlet/Violet, and Let's Go Pikachu/Eevee
- Per-pokémon location, catch method, weather/biome, rarity %, level range, and version exclusivity
- Includes DLC areas (Isle of Armor, Crown Tundra, Teal Mask, Indigo Disk)
- Loaded via script tags for reliable WebView compatibility (no file:// fetch issues)
- Integrated into the Catch sub-tab of every Pokémon's detail view
- Integrated into the Locations tab — curated games show real encounter lists per location
- Falls back to PokéAPI for Gen 1-7 games

**📦 Offline mode**
- IndexedDB-based cache for Pokémon data, sprites, and artwork
- Bulk download all 1,025 Pokémon's data + images in one go (6-phase download, resumable, cancellable)
- ~530-630 MB for full coverage
- Automatic memory → IDB → network fallback with retry logic
- "No connection & no cached data" fallback screen
- Manage from Settings → Offline Data

**🏠 Redesigned launchpad**
- New Pokédex hero tile with pokéball anatomy (red gradient, equator line, centre button)
- Square tile grid with minimalist white-outlined icons (Bosses, Locations, Moves, TM & HM)
- Frosted-glass Progress tile with live ring chart showing pinned game's dex completion
- Optional "Currently Playing" strip at top when a game is pinned
- Compare, Type Chart, and Items in a clean bottom list

**🔍 Dex grid view upgrade**
- Frosted-glass grid cells in fancy mode with subtle inner highlight ring
- Scale animation on press
- Slightly larger gaps and rounded corners

**🎮 Game filter improvements**
- No longer persists between sessions — always starts on "All" to avoid stale filters
- Locations tab respects game filter: narrows to the active game's region and filters encounters by game version
- Compare auto-opens the game picker on entry
- Regional dex accuracy fixed: Sun/Moon shows 302 (not 809), Ultra Sun/Ultra Moon shows 403
- Curated games use their actual species count for dex totals (not the gen-cap fallback)

**🎯 Polish & fixes**
- Nav bar slides in from the right in glass mode (no more instant pop-up)
- Phantom close-on-load animation fixed with js-ready class gating
- Items per page options updated to 50, 100, 200, 300, 500, All (default 100)
- "Routes" feature removed — was never functional, showed "not available" messages. All games now show Pokédex + Bosses + Wanted in the Progress Checker.
- Legends: Arceus boss card shows a clear "uses Wardens instead of Gyms" message instead of empty state
- `mixed` type added to type color map so champions with diverse teams show a gray type pill

### v1.2.0

A massive UI overhaul plus a brand new feature.

**🎨 Liquid glass UI**
- Frosted-glass top bars, bottom nav, cards, modals, and pagination buttons — inspired by iOS Control Center
- Type-color atmospheric backdrops behind the glass: every Pokémon's detail page is tinted with its own type colors all the way down the page, and the compare view splits the page with one Pokémon's colors on each side
- Soft fade-out at the bottom of every page so the gradient blends seamlessly into the background
- Performance-tuned: scroll-heavy areas (list rows) skip per-row blur to stay buttery smooth on the Thor's WebView

**⚙️ Settings menu** *(replaces the old per-screen toggles)*
- Single ⚙ button next to the game selector opens a Settings sheet
- **Appearance** — toggle Dark / Light theme
- **Graphics** — toggle Fancy (glass) / Simple (flat) — one tap to drop the effects on weaker devices
- **Items per Page** — choose 20, 40, 60, 100, or **All** (single long scrollable list)
- All settings persist across app restarts

**⚖️ Pokémon comparison**
- New "Compare" button in any Pokémon's detail view's hero
- Pick a second Pokémon from a dedicated picker (the one you started from is greyed out and shown at the bottom for context)
- Picker has its own list ↔ grid view toggle, separately persistent from the main Pokédex
- Picker respects the global game filter
- Three side-by-side comparison tabs:
  - **Stats** — base stat bars with winners highlighted in green, totals, height/weight/catch rate, abilities side-by-side
  - **Type** — type pills + defensive matchups grouped by Immune / Weak / Resists
  - **Moves** — shared moves first, then moves unique to each (filtered by current game)
- Tap either Pokémon's portrait at the top to swap it without backing out — so you can chain comparisons quickly

**🎯 Better navigation & polish**
- Floating prev/next page buttons in the bottom corners — they fade out when you scroll down and slide back in when you scroll up
- Page counter pill in the top bar shows current page, total pages, and total result count
- ✕ clear button inside every search bar
- Rich move rows everywhere — name, description, power, accuracy, type badge, and damage category icon
- Sub-tabs under the hero auto-hide on scroll-down for full-screen content viewing
- Fixed light mode contrast issues across the app

### v1.1.0

- 🗺️ **Location emojis** — each location type has a distinct, consistent emoji icon
- 🎨 **Improved theme toggle** — icon now correctly reflects the action
- 📇 **Grid view for Pokédex** — toggle between list and grid layouts
- 💾 **Persistent settings** — your theme choice, game filter, and Pokédex view are saved between sessions

### v1.0.0

- Initial release
- Full Pokédex, Moves, TMs/HMs, Items, Locations, Type Chart
- Global game filter with 21 game versions
- Light & dark themes
- Custom Pokéball launcher icon
