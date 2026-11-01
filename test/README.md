# Tests

```sh
yarn test          # unit + characterization tests (what CI runs)
yarn test:watch
yarn typecheck
```

- `unit/`: pure helpers (app ids, Steam ids, VDF files).
- `characterization/`: snapshot what SRM produces today for realistic
  inputs (parsers run over temp ROM trees and a fake Steam install). These are
  the regression contract for refactors: a snapshot diff means behaviour
  changed. Only update snapshots (`yarn test -u`) for intended changes, and
  review the diff.
- `live/`: drift checks against a real Steam install and SRM userData, to
  catch Steam changing its file formats. Skipped unless configured; read-only
  (writes only go to temp copies). Run locally, e.g. in PowerShell:

  ```powershell
  $env:SRM_LIVE_STEAM_DIR = "C:\Program Files (x86)\Steam"
  $env:SRM_LIVE_ACCOUNT_ID = "<folder under userdata>"
  $env:SRM_LIVE_USERDATA = "$env:APPDATA\steam-rom-manager\userData"
  yarn test test/live
  ```

Tests run in plain Node, not Electron. `setup.ts` swaps out the modules that
need Electron or a browser (`src/variables`, `src/paths`, the image-provider
workers) for stubs in `stubs/`; everything else is the real code. Nothing
touches the network or a real Steam/SRM install outside `live/`.
