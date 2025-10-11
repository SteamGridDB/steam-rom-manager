# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Steam ROM Manager (SRM) is an Electron application built with Angular that manages ROMs and non-Steam games in Steam. It automatically adds games to Steam libraries with artwork, controller templates, and proper categorization.

## Development Commands

### Essential Commands
- `yarn install` - Install dependencies (run after cloning)
- `yarn run build:dist` - Build both main and renderer processes for production
- `yarn run start` - Launch the compiled application
- `yarn run watch:main` - Watch and recompile main Electron process
- `yarn run watch:renderer` - Watch and recompile Angular renderer process
- `yarn run pretty:check` - Check code formatting with Prettier
- `yarn run pretty:write` - Auto-format code with Prettier

### Building for Distribution
- `yarn run build:win` - Build Windows installer/portable
- `yarn run build:linux` - Build Linux deb package and AppImage
- `yarn run build:mac` - Build macOS dmg package

### Development Workflow
1. Run `yarn run watch:main` once (rarely changes)
2. Run `yarn run watch:renderer` for ongoing development
3. Use `yarn run start` to launch the app
4. Refresh with Ctrl+R after renderer changes
5. Restart app after main process changes

## Architecture

### Main Process (`src/main/`)
- **app.ts** - Electron main process with CLI interface, crash reporting, auto-updater
- Handles window management, IPC communication, and system integration

### Renderer Process (`src/renderer/`)
- **Angular 18** application with TypeScript
- **app.module.ts** - Main Angular module configuration
- **components/** - UI components organized by feature
- **services/** - Data services and business logic
- **templates/** - HTML templates for components
- **styles/** - SCSS stylesheets

### Core Libraries (`src/lib/`)
- **parsers/** - Game/ROM parsers for different platforms (Steam, Epic, GOG, emulators)
  - Each parser implements specific platform logic
  - Support for both ROM files and digital store libraries
- **vdf-manager.ts** - Steam VDF file manipulation
- **category-manager.ts** - Steam category management
- **controller-manager.ts** - Controller template handling
- **image-provider.ts** - Artwork fetching and caching
- **file-parser.ts** - File system parsing and glob matching

### Parser System
The parser architecture supports multiple game sources:
- **ROM Parsers**: glob, glob-regex, manual
- **Platform Parsers**: Steam, Epic, GOG, EA Desktop, Amazon Games, Ubisoft Connect, etc.
- **Artwork Parsers**: Steam games, non-SRM shortcuts

### Steam Category Storage System

SRM writes category data to three storage locations in priority order (newest to oldest):

1. **Cloud Storage** (Primary/Modern - Steam Deck default):
   - `~/.steam/steam/userdata/<userid>/config/cloudstorage/cloud-storage-namespace-*.json`
   - Synced across devices
   - SRM writes to ONE system only, stopping after first success

2. **localconfig.vdf** (Fallback):
   - `~/.steam/steam/userdata/<userid>/config/localconfig.vdf`
   - Traditional Steam configuration file

3. **leveldb** (Legacy):
   - `~/.steam/steam/config/htmlcache/Local Storage/leveldb/*.ldb`
   - Browser storage used by older Steam versions

**Read Priority**: Cloud storage → localconfig.vdf → leveldb
**Write Strategy**: Try cloud storage first; if it fails, fall back to localconfig.vdf, then leveldb as last resort

### Steam Process Management

When auto-kill Steam is enabled, SRM needs to detect when Steam processes are fully stopped:

**Process checked on Linux/Steam Deck**:
- `steam` - Main Steam client process

**Important findings from testing**:
- Steam does NOT keep category files locked - it reads/writes them transiently
- Files can technically be written while Steam is running, BUT:
  - Race condition risk if Steam writes at the same moment
  - Steam caches category data in memory and won't see changes until restart
  - Therefore, killing Steam before writes is the safest approach

**Not checked** (these don't prevent category file operations):
- `steamwebhelper` - Web rendering helper (never holds category files)
- `reaper` - Game process manager (doesn't hold category files)
- `steamos-manager` - System daemon (not part of Steam client)
- `fossilize_replay` - Background shader compiler (doesn't prevent operations)

**Detection uses exact matching** (`pgrep -x '^steam$'`) to avoid matching SRM's own process name.

### Configuration
- **TypeScript**: ES2022 target with Angular decorators
- **Webpack**: Separate configs for main/renderer processes
- **Electron Builder**: Multi-platform distribution
- **Prettier**: Code formatting with auto end-of-line

### Key Technologies
- Electron 32+ with remote module
- Angular 18 with RxJS
- Node.js file system operations
- Steam VDF format parsing
- SQLite for local data storage
- SteamGridDB API integration

## Testing and Quality

The project uses:
- TypeScript strict mode with noImplicitAny
- Prettier for code formatting
- Electron Builder for consistent builds
- Native module recompilation via postinstall

## CLI Interface

SRM includes a full CLI with commands like:
- `list` - Show all parsers and status
- `add` - Add games to Steam
- `remove` - Remove games from Steam
- Multiple parser-specific options and flags

## Important Notes

### Steam Process Detection
- Always use exact process name matching to avoid false positives
- SRM's process name may contain "steam" - ensure checks use `pgrep -x` with regex anchors
- Only check processes that actually hold category storage files open

### Category File Operations
- Priority order: cloud storage → localconfig.vdf → leveldb
- Write to ONE system only (stop after first success)
- Graceful error handling at each level
- Steam must be fully stopped before writing

### Auto-Restart Behavior
- If `autoRestartSteam` is ON: Steam restarts immediately after save
- If `autoRestartSteam` is OFF but Steam was killed: Steam restarts when SRM exits
- Prevents leaving users with Steam permanently closed
