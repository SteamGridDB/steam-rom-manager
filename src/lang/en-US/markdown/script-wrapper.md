# Script wrapper

With **Wrap shortcut in a shell script** on, a game's Steam shortcut doesn't start the game directly. It runs a script SRM writes for the game, which:

1. runs your **pre-launch script**, then waits its delay;
2. starts the game;
3. once the game has started, waits the post-launch delay, then runs your **post-launch script**;
4. waits until the game has exited;
5. waits the post-exit delay, then runs your **post-exit script**.

Since the script keeps running until the game exits, Steam shows the game as running (and counts play time) until then, even for games that start through a launcher.

All three scripts are optional, and every delay is in seconds (0 by default). On Windows, scripts are PowerShell scripts (`.ps1`; `.bat`, `.cmd` and `.exe` work too). On Linux and macOS, they're shell scripts: run directly if they're executable (so any `#!` interpreter works), otherwise with `sh`.

## When a script fails

A script that's missing, fails or exits with an error is **logged and skipped**: the game still starts, and the next step still runs. Every launch writes to `launch.log` in the `launch-wrappers` folder of SRM's `Config Directory`, along with your scripts' output. That's the first place to look if a script doesn't do what you expect.

Each script runs to the end before the next step, so a post-launch script that keeps running holds up noticing that the game has exited. Start long-running tools in the background from your script.

## What scripts get

These environment variables are set for every script:

| Variable         | Value                                                                          |
| ---------------: | :----------------------------------------------------------------------------- |
| `SRM_GAME_TITLE` | The game's title                                                               |
| `SRM_STAGE`      | `pre-launch`, `post-launch` or `post-exit`                                     |
| `SRM_RUN_DIR`    | A folder for this launch only, for scripts to pass files to each other in      |

## Things to know

- The shortcut's executable becomes SRM's launch script (PowerShell on Windows, `sh` elsewhere), so turning wrapping on or off gives the games new app IDs: the next save replaces their shortcuts. Artwork and collections come along as usual.
- Some parsers wrap their games themselves (Battle.net, and Epic with **Wait for the game to exit**). Their own steps run inside yours: after your pre-launch script, and before your post-launch and post-exit scripts.
- On Linux, Steam would run the shell script with a forced Steam Play compatibility tool (such as Proton), which can't work. So a parser that forces one doesn't wrap its games. (Forcing a tool for a single wrapped game, from Exceptions, has the same problem.)
- The files SRM writes (in the `launch-wrappers` folder) are rewritten every time you save to Steam, so change your parser rather than those files.
