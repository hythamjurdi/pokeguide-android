# PokéGuide

A beautifully designed Pokémon companion app for Android. Originally built for the [AYN Thor](https://www.aynstore.com/products/thor) handheld's bottom screen, but runs on any Android 7.0+ device.

All data pulled live from [PokéAPI](https://pokeapi.co).

---

## 📥 Download

**[⬇️ Download the latest APK](https://github.com/hythamjurdi/pokeguide-android/releases/latest)**

Or grab it from the [Releases](https://github.com/hythamjurdi/pokeguide-android/releases) page.

### How to install

1. Download `PokeGuide-v1.0.0.apk` from the link above
2. On your Android device, go to **Settings → Security** (or **Apps → Special access**) and allow installation from unknown sources for your browser/file manager
3. Tap the downloaded APK file and follow the prompts
4. Open **PokéGuide** from your app drawer — look for the red Pokéball icon

---

## ✨ Features

### 🔴 Pokédex
- Browse all **1,025 Pokémon** across all 9 generations
- Official sprites, Pokédex numbers, and names
- Fast search by name or Pokédex number

### 📖 Pokémon Detail View
- Full-bleed gradient hero using the Pokémon's type colors
- **High-resolution official artwork** with normal/shiny toggle
- Species genus and Pokédex number prominently displayed
- **Info tab** — flavor text, full base stat bars with total, type matchups (Immune / Weak / Resists), abilities (regular + hidden), height, weight, base XP, catch rate, generation, legendary status
- **Evolution tab** — every evolution stage with large sprites and accurate requirements (level, stone, trade, friendship, held item, time of day, location, known move, rain, etc.)
- **Catch tab** — base catch rate, happiness, growth rate, egg groups, and wild encounter locations
- **Moves tab** — full move list filtered by learn method and game, each move tappable for details
- Sub-tabs auto-hide on scroll down for maximum screen space, slide back up on scroll up

### ⚡ Moves
- Full database of all **~900 moves**
- Rich list rows with name, description, power, accuracy, type badge, and damage category (physical/special/status)
- Tap any move for full details: flavor text, effect description, stats (Power / Accuracy / PP / Priority / Type / Category)
- **"View Learners"** button — see every Pokémon that can learn the move, tap any to jump to its detail page

### 💿 TM & HM
- Per-game machine layouts (accurate to each game — HM04 in XY is different from HM04 in Red/Blue)
- Split by HM and TM sections
- Full TM/HM detail pages with official item sprite, gradient type banner, and **"View Learners"** button

### 🎒 Items
- Browse and search the full item database
- Category, effect description, cost, fling power, and attributes
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
- Choose from **21 game versions**, from Red/Blue through Scarlet/Violet
- Each game shown with its own colored icon and abbreviation (RB, GS, RS, FRLG, DP, BW, XY, SM, SwSh, BDSP, LA, SV, etc.)
- **Persistent across the entire app** — your selection filters Pokédex, Items, Moves, TMs/HMs, and Pokémon move lists globally

### 🌓 Light & Dark Themes
- One-tap toggle on every major screen

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
5. The APK will be at `app/build/outputs/apk/release/PokeGuide-v1.0.0.apk`

The release build is signed with the standard Android debug keystore for easy local installs. If you don't have one, run:
```bash
keytool -genkey -v -keystore ~/.android/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
```

### Tech stack

| Layer        | Tech                                         |
| ------------ | -------------------------------------------- |
| **Android**  | Java, native WebView, single `MainActivity`  |
| **Frontend** | Pure vanilla JavaScript, HTML, CSS (single file, ~66KB) |
| **Styling**  | CSS custom properties for light/dark theming |
| **Data**     | [PokéAPI](https://pokeapi.co) (live)         |
| **Build**    | Gradle 8.0, AGP 8.1, minSdk 24, targetSdk 34 |

No npm, no webpack, no React, no build step for the frontend — just open `app/src/main/assets/index.html` in a browser and it works.

</details>
