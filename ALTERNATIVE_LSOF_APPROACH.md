# Alternative Approach: Using lsof to Check File Locks

If checking only the main `steam` process isn't sufficient, here's an alternative approach that checks which processes actually have the category storage files open:

## Implementation

```typescript
// In stop-start-steam.ts, replace the Linux stopSteam check with:

} else if (os.type() == "Linux") {
  data.commands = {
    action: `kill -15 $(pidof -x steam) 2>/dev/null || true`,
    check: `
      # Find steam directory from common locations
      STEAM_DIR=""
      if [ -d "$HOME/.steam/steam" ]; then
        STEAM_DIR="$HOME/.steam/steam"
      elif [ -d "$HOME/.local/share/Steam" ]; then
        STEAM_DIR="$HOME/.local/share/Steam"
      fi

      if [ -z "$STEAM_DIR" ]; then
        # Can't find steam dir, just check for steam process
        steam_pid=$(pgrep -x '^steam$' 2>/dev/null)
        if [ -z "$steam_pid" ]; then echo "True"; else echo "False"; fi
      else
        # Check if any process has the category files open
        # Check cloud storage, localconfig.vdf, or leveldb files
        CLOUD_FILES=$(find "$STEAM_DIR/userdata/*/config/cloudstorage" -name "cloud-storage-namespace-*.json" 2>/dev/null)
        LOCALCONFIG_FILES=$(find "$STEAM_DIR/userdata/*/config" -name "localconfig.vdf" 2>/dev/null)
        LEVELDB_DIR="$STEAM_DIR/config/htmlcache/Local Storage/leveldb"

        HAS_LOCKS=0

        # Check cloud storage files
        for file in $CLOUD_FILES; do
          if lsof "$file" 2>/dev/null | grep -q .; then
            HAS_LOCKS=1
            break
          fi
        done

        # Check localconfig.vdf files
        if [ $HAS_LOCKS -eq 0 ]; then
          for file in $LOCALCONFIG_FILES; do
            if lsof "$file" 2>/dev/null | grep -q .; then
              HAS_LOCKS=1
              break
            fi
          done
        fi

        # Check leveldb directory
        if [ $HAS_LOCKS -eq 0 ] && [ -d "$LEVELDB_DIR" ]; then
          if lsof +D "$LEVELDB_DIR" 2>/dev/null | grep -q .; then
            HAS_LOCKS=1
          fi
        fi

        if [ $HAS_LOCKS -eq 0 ]; then
          echo "True"
        else
          echo "False"
        fi
      fi
    `.trim(),
  };
  data.shell = "/bin/sh";
}
```

## Pros
- Most accurate - checks actual file locks
- Won't have false positives from unrelated Steam processes
- Works regardless of Steam's internal process architecture

## Cons
- More complex
- Requires `lsof` to be installed (usually is on Linux)
- Slower due to file system checks
- May require permissions to check file locks

## Recommendation

**Start with the simple approach (only checking main steam process)** and only implement this if you find that:
1. Helper processes actually do hold the files open
2. Users report write failures when they shouldn't happen

The simple approach is cleaner, faster, and aligns with the CLAUDE.md documentation which states that only the main `steam` process and `steamwebhelper` hold category files - and we now know `steamwebhelper` is just for web rendering.
