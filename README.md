# AoE4 Production Overlay

A floating, semi-transparent desktop overlay for Age of Empires IV that calculates villager requirements for continuous unit production. Designed for practice and training — use it alongside your games to improve resource allocation instincts and mental math for production planning.

Updated for AoE4 Patch **15.4.8719** (Season 15, April 2026).

**Web version**: [https://bdemo.github.io/aoe4-prod-overlay/](https://bdemo.github.io/aoe4-prod-overlay/)

## Features

- **Production Planning** — Select units from the production queue and instantly see how many villagers you need on each resource (food, wood, gold, stone)
- **22 Civilizations** — Full support for all civilizations with civ-specific modifiers, gathering rate bonuses, production speed adjustments, and cost modifiers
- **Passive Income** — Accounts for passive income sources like Relics, Sacred Sites, Pit Mines, Cattle Ranches, Pagodas, and more
- **Modifier System** — Toggle common upgrades (Wheelbarrow, Horticulture, Double Broadax, etc.) and civ-specific techs with building source icons and age indicators
- **Bookmarkable Modifiers** — Star your frequently used modifiers for quick reference
- **Player Lookup** — Search any player via the aoe4world.com API to see rating, win rate, W/L record, and last game details with full opponent stats
- **Auto-Refresh** — Player data updates every 60 seconds
- **Compact Mode** — Collapse to show only the villager requirements and production queue
- **Always-on-Top** — Designed to overlay on top of AoE4 in Borderless Windowed mode
- **Customizable Hotkeys** — Configurable keyboard shortcuts for compact mode, hide, and opponent panel (persisted across sessions)
- **System Tray** — Minimize to system tray; double-click tray icon to restore

## Screenshot

```
+-----------------------------------+
| [S][C][M][-][x] AoE4 Prod Overlay |
+-----------------------------------+
| VILLAGER REQUIREMENTS             |
| Food  ████████████████  4.2       |
| Wood  ████████          2.1       |
| Gold  ████████████      3.0       |
| Stone                   0.0       |
| Total Villagers         9.3       |
+-----------------------------------+
| Civ: [English            v]       |
| [unit icons...]                   |
| Production Queue         [Clear]  |
| Spearman        [-] 2 [+]        |
| Archer          [-] 3 [+]        |
+-----------------------------------+
| MODIFIERS                [Reset]  |
| COMMON                            |
|   Wheelbarrow +5%  [TC] [I]      |
|   Horticulture +8% [Mill] [II]   |
| ENGLISH                           |
|   Dark Age farm +17%              |
+-----------------------------------+
```

## Requirements

- Windows 10/11
- AoE4 in **Borderless Windowed** mode (fullscreen exclusive will hide the overlay)
- Python 3.8+ with PyQt5 and PyQtWebEngine (for running from source)

## Quick Start

### Option 1: Standalone Executable

Download `AoE4ProdOverlay.exe` from the [Releases](https://github.com/BDeMo/aoe4-prod-overlay/releases) page and run it directly. No installation required.

### Option 2: Run from Source

```bash
pip install PyQt5 PyQtWebEngine
python main.py
```

### Option 3: Auto-install Launcher

```bash
python start.py
```

This will automatically install dependencies if missing and launch the overlay.

## Build Executable

```bash
python build_exe.py
```

The output will be in `dist/AoE4ProdOverlay.exe`.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+M` | Toggle compact mode |
| `Ctrl+H` | Hide/show overlay |
| `Ctrl+O` | Toggle opponent panel |

All shortcuts are customizable in Settings.

## Controls

- **Gear icon** — Open settings (hotkeys, layout, reset)
- **Square icon** — Toggle compact mode
- **Minus icon** — Minimize to system tray
- **X icon** — Close application
- **Right-click tray icon** — Menu with show/hide, compact, click-through, opacity controls
- **Double-click tray icon** — Restore window

## Tech Stack

- **Python + PyQt5** — Desktop window (transparent, frameless, always-on-top)
- **QWebEngineView** — Embedded Chromium for rendering the UI
- **Vanilla JavaScript** — Calculator logic and UI (no build step)
- **PyInstaller** — Standalone executable packaging

## Acknowledgments

Special thanks to the open-source projects and communities that made this possible:

- [aoe4-production-calculator](https://github.com/SichYuriy/aoe4-production-calculator) — Unit data and calculation logic
- [aoe4world.com](https://aoe4world.com) — Player statistics API
- [AoE4_Overlay](https://github.com/FluffyMaguro/AoE4_Overlay) — Civilization flags

## Support

If this overlay saved your eco from total collapse, consider mass-producing a coffee for me — no villagers required, just Zelle: [3101ihs@gmail.com](mailto:3101ihs@gmail.com)

## License

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — You are free to share and adapt this software, provided you give appropriate credit and do not use it for commercial purposes.

---

Made by **SamJ**
