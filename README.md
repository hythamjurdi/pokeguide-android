# PokéGuide

A beautifully designed Pokémon companion app for Android. Originally built for the [AYN Thor](https://www.aynstore.com/products/thor) handheld's bottom screen, but runs on any Android 7.0+ device.

All data pulled live from [PokéAPI](https://pokeapi.co).

---

## 📥 Download

**[⬇️ Download the latest APK](https://github.com/hythamjurdi/pokeguide-android/releases/latest)**

Or grab it from the [Releases](https://github.com/hythamjurdi/pokeguide-android/releases) page.

### How to install

1. Download `PokeGuide-v1.2.0.apk` from the link above
2. On your Android device, go to **Settings → Security** (or **Apps → Special access**) and allow installation from unknown sources for your browser/file manager
3. Tap the downloaded APK file and follow the prompts
4. Open **PokéGuide** from your app drawer — look for the red Pokéball icon

> **Upgrading from a previous version?** Just install the new APK — Android will update the existing app and keep your settings.

---

## 📝 Changelog

### v1.2.0 — *Latest*

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
- Floating prev/next page buttons in the bottom corners (replaces the old bottom bar) — they fade out when you scroll down for max screen space and slide back in when you scroll up
- Page counter pill in the top bar shows current page, total pages, and total result count (e.g. `1/22 · 1025`)
- ✕ clear button inside every search bar — instantly empty a search and restore the full list
- Rich move rows everywhere (Pokédex detail Moves tab, Compare Moves tab, TM/HM list) — name, description, power, accuracy, type badge, and damage category icon
- Compare moves now show full Pokémon names in the column headers instead of 4-letter abbreviations
- Compare result page header scrolls with content (no longer pinned) for more screen real estate
- Sub-tabs under the hero auto-hide on scroll-down for full-screen content viewing
- Fixed light mode contrast issues across the app — abilities, characteristics, and other secondary text are now properly legible on white backgrounds
- Removed the curved "wave" divider between hero and content for a cleaner, more cohesive look

### v1.1.0

- 🗺️ **Location emojis** — each location type has a distinct, consistent emoji icon (routes, caves, forests, cities, towers, gyms, seas, etc.)
- 🎨 **Improved theme toggle** — icon now correctly reflects the action: 🌙 in dark mode, ☀ in light mode
- 📇 **Grid view for Pokédex** — toggle between list and grid layouts
- 💾 **Persistent settings** — your theme choice, game filter, and Pokédex view are saved between sessions

### v1.0.0

- Initial release
- Full Pokédex, Moves, TMs/HMs, Items, Locations, Type Chart
- Global game filter with 21 game versions
- Light & dark themes
- Custom Pokéball launcher icon

---

## ✨ Features

### 🔴 Pokédex
- Browse all **1,025 Pokémon** across all 9 generations
- **Toggle between list and grid views** — grid shows larger sprites for quick visual scanning
- Official sprites, Pokédex numbers, and names
- Fast search by name or Pokédex number with a one-tap clear button

### 📖 Pokémon Detail View
- Full-bleed gradient hero using the Pokémon's type colors
- **Type-color atmospheric backdrop** flows down the entire page in fancy mode — every card floats on a tinted gradient that matches the Pokémon
- **High-resolution official artwork** with normal/shiny toggle
- **Compare button** — tap to compare with any other Pokémon side-by-side
- **Info tab** — flavor text, base stat bars with total, type matchups, abilities (regular + hidden), height, weight, base XP, catch rate, generation, legendary status
- **Evolution tab** — every stage with large sprites and accurate requirements (level, stone, trade, friendship, held item, time of day, location, known move, rain, etc.)
- **Catch tab** — base catch rate, happiness, growth rate, egg groups, wild encounter locations
- **Moves tab** — full move list with rich details (power, accuracy, type, damage category) filtered by learn method and game
- Sub-tabs auto-hide on scroll-down for max screen space

### ⚖️ Compare Pokémon
- Side-by-side comparison of any two Pokémon
- **Stats tab** — base stat bars with winners highlighted, totals, height/weight, abilities
- **Type tab** — type pills + defensive matchup breakdown
- **Moves tab** — shared moves with both learn levels, then moves unique to each Pokémon
- Tap either portrait at the top to swap that slot for a different Pokémon
- Type-color atmospheric backdrop splits the page (left side tinted by Pokémon A's types, right by B's)

### ⚡ Moves
- Full database of all **~900 moves**
- Rich list rows: name, description, power, accuracy, type badge, damage category (physical/special/status)
- Tap any move for full details and a list of every Pokémon that can learn it

### 💿 TM & HM
- Per-game machine layouts (HM04 in XY differs from HM04 in Red/Blue)
- Split into HM and TM sections with rich rows showing all move details
- Tap any TM/HM for full details and learner list

### 🎒 Items
- Browse and search the full item database
- Category, effect description, cost, fling power, attributes, official sprites

### 📍 Locations
- Drill down from Region → Location → Encounter details
- Distinct emoji icon per location type, consistent across all regions
- Every region from Kanto to Paldea
- Each encounter shows the Pokémon, games it appears in, and level range

### 🔀 Type Chart
- Full interactive 18×18 type effectiveness matrix
- Toggle between **Attacking** and **Defending** views
- Color-coded cells

### 🎮 Global Game Filter
- Tap the game badge in any top bar to open the picker
- **21 game versions**, from Red/Blue through Scarlet/Violet
- Persistent across the entire app and across sessions
- "All Games" option to remove the filter

### ⚙ Settings
- Dark / Light theme
- Fancy / Simple graphics (toggle the glass effects on or off)
- Items per page (20, 40, 60, 100, or All)
- All settings saved between sessions

### 🎯 Quality of life
- Floating prev/next page buttons that auto-hide on scroll
- Page counter in every list view's top bar
- One-tap clear buttons on every search input
- One-button settings access — no menu diving
- Rich, lazily-loaded move details so the app stays responsive

---

## 📱 Designed for the AYN Thor

The AYN Thor is an Android handheld with a 1080×1920 bottom screen. PokéGuide was built from the ground up with that form factor in mind: compact layouts, touch targets sized for thumb use, fullscreen immersive mode, and landscape-friendly. But everything scales nicely — it works just as well on a phone or tablet.

---

## 🙏 Credits

- Pokémon data: [PokéAPI](https://pokeapi.co)
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
5. The APK will be at `app/build/outputs/apk/release/PokeGuide-v1.2.0.apk`

The release build is signed with the standard Android debug keystore for easy local installs. If you don't have one, run:
```bash
keytool -genkey -v -keystore ~/.android/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
```

### Tech stack

| Layer        | Tech                                            |
| ------------ | ----------------------------------------------- |
| **Android**  | Java, native WebView, single `MainActivity`     |
| **Frontend** | Pure vanilla JavaScript, HTML, CSS (one file)   |
| **Styling**  | CSS custom properties + `backdrop-filter` glass |
| **Storage**  | `localStorage` for persistent settings          |
| **Data**     | [PokéAPI](https://pokeapi.co) (live)            |
| **Build**    | Gradle 8.0, AGP 8.1, minSdk 24, targetSdk 34    |

No npm, no webpack, no React, no build step for the frontend — just open `app/src/main/assets/index.html` in a browser and it works.

</details>
