# PokéGuide

A beautifully designed Pokémon companion app for Android, built as a lightweight native WebView wrapper around a single-file vanilla JavaScript frontend. Originally designed for the [AYN Thor](https://www.aynstore.com/products/thor) handheld's 1080×1920 bottom screen, but runs on any Android 7.0+ device.

All data is pulled live from [PokéAPI](https://pokeapi.co) — no bundled databases, always up to date.

---

## ✨ Features

### 🔴 Pokédex
- Browse all **1,025 Pokémon** across all 9 generations
- Clean list view with official sprites, Pokédex numbers, and names
- Fast search by name or Pokédex number
- Paginated for smooth scrolling

### 📖 Pokémon Detail View
- Full-bleed gradient hero using the Pokémon's type colors
- **High-resolution official artwork** (150×150) with shiny toggle right next to it
- Species genus and Pokédex number
- **Info tab** — Pokédex flavor text, full base stat bars with total, type matchups (Immune / Weak / Resists), abilities (regular + hidden), height, weight, base XP, catch rate, generation, legendary status
- **Evolution tab** — every evolution stage shown with large sprites and accurate requirements (level, stone, trade, friendship, held item, time of day, location, known move, rain, etc.)
- **Catch tab** — base catch rate, happiness, growth rate, egg groups, and wild encounter locations per game
- **Moves tab** — full move list filtered by learn method (level-up / TM-HM) and by selected game, each move tappable for details
- Sub-tabs auto-hide on scroll down for maximum screen space, slide back up on scroll up

### ⚡ Moves
- Full database of all **~900 moves**
- Rich list rows showing: name, short description, power, accuracy, type badge, damage category (physical/special/status)
- Tap any move for full details: flavor text, effect description, stats (Power / Accuracy / PP / Priority / Type / Category)
- **"View Learners"** button on every move — see every Pokémon that can learn it, tap any to jump to its detail page

### 💿 TM & HM
- Per-game machine layouts (different for each game, e.g. HM04 in XY is different from HM04 in Red/Blue)
- Split by HM and TM sections with bold section headers
- Rich list rows same as Moves — description, power, accuracy, type, category
- Full TM/HM detail pages with official item sprite, gradient type banner, and **"View Learners"** button

### 🎒 Items
- Browse and search the full item database
- Each item shows its category, effect description, cost, fling power, and attributes
- Official pixel-perfect item sprites

### 📍 Locations
- Drill down from Region → Location → Encounter details
- Every region from Kanto to Paldea
- Each encounter shows the Pokémon, which games it appears in, and level range
- Tap any Pokémon to jump to its Pokédex detail

### 🔀 Type Chart
- Full interactive 18×18 type effectiveness matrix
- Toggle between **Attacking** and **Defending** views
- Color-coded cells for immune / resist / normal / super-effective

### 🎮 Global Game Filter
- Tap the circular game badge in any top bar to open a full-screen game picker
- Choose from 21 game versions, from Red/Blue all the way through Scarlet/Violet
- Each game shown with its own colored icon and abbreviation (RB, GS, RS, FRLG, DP, BW, XY, SM, SwSh, BDSP, LA, SV, etc.)
- **Persistent across the entire app** — your selection filters Pokédex, Items, Moves, TMs/HMs, and Pokémon move lists globally
- "All Games" option at the top to remove the filter

### 🌓 Theme Support
- One-tap toggle between **dark** and **light** themes
- Theme button next to the game picker on every major screen

---

## 📱 Designed for the AYN Thor

The AYN Thor is an Android handheld with a 1080×1920 bottom screen. PokéGuide was built from the ground up with that form factor in mind:

- **Compact layouts** that use vertical space efficiently
- **Touch targets sized for thumb use** on a small physical screen
- **Fullscreen immersive mode** hides system bars
- **Landscape orientation** friendly
- **Custom WebView user agent** to bypass hotlink restrictions on image CDNs
- **Network security config** allowing the specific domains needed for PokéAPI

But everything scales nicely — it works just as well on a phone or tablet.

---

## 🏗️ Tech Stack

| Layer        | Tech                                         |
| ------------ | -------------------------------------------- |
| **Android**  | Java, native WebView, single `MainActivity`  |
| **Frontend** | Pure vanilla JavaScript, HTML, CSS           |
| **Styling**  | CSS custom properties for light/dark theming |
| **Data**     | [PokéAPI](https://pokeapi.co) (live)         |
| **Caching**  | In-memory cache for API responses            |
| **Build**    | Gradle 8.0, AGP 8.1, minSdk 24, targetSdk 34 |

The entire frontend lives in a single `index.html` file (~66KB). No npm, no webpack, no React, no build step — just open it and it works. The Java side is under 200 lines; all it does is configure a WebView and load the HTML from assets.

---

## 🔨 Building

Requires **Android Studio** (Hedgehog or newer).

1. Clone the repo:
   ```bash
   git clone https://github.com/hythamjurdi/pokeguide-android.git
   ```
2. Open the project in Android Studio and let Gradle sync
3. Select the `release` build variant: **Build → Select Build Variant** → choose `release` for the `app` module
4. Build the APK: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. The APK will be at `app/build/outputs/apk/release/app-release.apk`
6. Sideload onto your device

The release build is signed with the standard Android debug keystore for easy local installs. If you don't have one, run:
```bash
keytool -genkey -v -keystore ~/.android/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
```

---

## 🙏 Credits

- Pokémon data: [PokéAPI](https://pokeapi.co) — an incredible free, open resource
- Sprites & official artwork: [PokéAPI/sprites](https://github.com/PokeAPI/sprites)
- Pokémon © Nintendo / Creatures Inc. / GAME FREAK Inc.

This is a non-commercial fan project. All Pokémon names, images, and data are property of their respective owners.

---

## 📄 License

[MIT](LICENSE)
