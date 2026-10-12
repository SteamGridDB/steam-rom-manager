# End-to-end smoke tests (manual)

These run the built app (`yarn build:dist`) in real Electron against an
isolated environment: a fake Steam install and a copy of your SRM userData,
so your real Steam library and settings are never touched. They need a
display and network access (SteamGridDB, GitHub), so they are not part of CI.

```sh
# 1. Isolated environment: copies <your userData>, enables only the parser
#    whose title starts with "Snes9x" (pick another with the 3rd argument),
#    points it at fake ROMs, a fake RetroArch and a fake Steam (user "alice").
node test/e2e/setup.js "$APPDATA/steam-rom-manager/userData" /tmp/srm-e2e Snes9x

# 2a. CLI (headless)
SRM_USER_DATA_DIR=/tmp/srm-e2e/userData npx electron ./dist/main.bundle.js add
SRM_USER_DATA_DIR=/tmp/srm-e2e/userData npx electron ./dist/main.bundle.js remove

# 2b. GUI, driven over the DevTools protocol
SRM_USER_DATA_DIR=/tmp/srm-e2e/userData npx electron ./dist/main.bundle.js --remote-debugging-port=9333 &
node test/e2e/gui-driver.js 9333 test/e2e/gui-add-remove.json
```

The GUI steps use Angular's `ng` debugging global, which only exists in a
development build of the renderer: after `yarn build:dist`, rebuild it with
`npx webpack --config ./webpack/renderer.js`.

Step files:

- `gui-add-remove.json`: generate, save to Steam, remove.
- `gui-isolation.json`: the window is sandboxed (no `require`/`process`,
  only `window.srm`, other IPC channels refused); add/remove; View Games
  (shortcuts, details, artwork); Steam logins, compat tools, browsed paths.
- `gui-pages.json`: Settings (artwork cache/backups, shell scripts), the
  parser editor (compat tools), the log page, closing from the title bar.
  Run it last: it closes the app.
- `gui-exceptions.json`: exceptions page (tabs, how rules match, adding by
  title) and Add Games (exclusions, a game's changes, exclusions keeping them).
- `gui-parsers.json`: the Parsers tab: one editor per parser (nothing from
  one parser's form carries into another's), create, move, undo.

The fake Steam install ends up in `/tmp/srm-e2e/steam`; inspect
`userdata/11111111/config` (shortcuts.vdf, grid/, cloudstorage/) after each
step. If Electron behaves like plain Node, unset `ELECTRON_RUN_AS_NODE`
(VS Code's terminal sets it).
