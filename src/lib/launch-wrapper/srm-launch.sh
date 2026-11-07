# Steam ROM Manager's launch script (Linux, macOS). A wrapped shortcut runs
# the game's own file in launch-wrappers/<Steam user>/, which sets the game's
# settings and sources this. It runs the scripts set for each stage
# (pre-launch, post-launch, post-exit), starts the game and waits for it to
# exit, so Steam shows it as running until then.
#
# A failing or missing script is logged (launch.log) and skipped: the game
# still starts. Scripts get SRM_GAME_TITLE, SRM_STAGE and SRM_RUN_DIR (a
# folder for this launch's scripts to share files in) as environment
# variables.
#
# SRM writes this file when it saves to Steam; changes to it are overwritten.

SRM_RUN_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t srm-launch)
SRM_GAME_TITLE=$SRM_TITLE
export SRM_RUN_DIR SRM_GAME_TITLE

srm_log() {
  if [ -f "$SRM_LOG" ] && [ "$(wc -c <"$SRM_LOG")" -gt 1048576 ]; then
    mv -f "$SRM_LOG" "$SRM_LOG.old"
  fi
  printf '%s [%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$SRM_TITLE" "$1" >>"$SRM_LOG" 2>/dev/null
}

srm_wait() {
  case "$1" in
    "" | 0 | 0.0) ;;
    *) sleep "$1" 2>/dev/null || sleep "${1%%.*}" ;;
  esac
}

# Runs one script (in a subshell, so it can't change this one) and waits for
# it. $1 stage, $2 script, $3 its arguments (shell words).
srm_step() {
  SRM_STAGE=$1
  export SRM_STAGE
  [ -n "$2" ] || return 0
  if [ ! -f "$2" ]; then
    srm_log "$1: script not found, skipped: $2"
    return 0
  fi
  srm_log "$1: running $2"
  (
    srm_script=$2
    eval "set -- $3"
    if [ -x "$srm_script" ]; then "$srm_script" "$@"; else sh "$srm_script" "$@"; fi
  ) >>"$SRM_LOG" 2>&1 </dev/null
  srm_code=$?
  if [ "$srm_code" -ne 0 ]; then
    srm_log "$1: $2 failed (exit code $srm_code); carrying on"
  fi
}

# $1 stage name, $2 variable prefix (e.g. SRM_PRELAUNCH). Pre-launch scripts
# wait (delay) after running; the others before.
srm_stage() {
  eval "srm_count=\${$2_COUNT:-0}"
  srm_i=1
  while [ "$srm_i" -le "$srm_count" ]; do
    eval "srm_script=\${$2_${srm_i}_SCRIPT}; srm_args=\${$2_${srm_i}_ARGS}; srm_delay=\${$2_${srm_i}_DELAY}"
    [ "$1" = pre-launch ] || srm_wait "$srm_delay"
    srm_step "$1" "$srm_script" "$srm_args"
    [ "$1" != pre-launch ] || srm_wait "$srm_delay"
    srm_i=$((srm_i + 1))
  done
}

# Is anything in the game's process group still running? (Not counting
# zombies: the started process exited but isn't reaped until `wait`.)
srm_running() {
  ps -A -o pgid= -o stat= 2>/dev/null |
    awk -v g="$1" '$1 == g && $2 !~ /^Z/ { found = 1 } END { exit !found }'
}

srm_log "launching"
srm_stage pre-launch SRM_PRELAUNCH

# The game runs in its own process group (job control), so the processes it
# starts are still found after the one started here exits.
set -m
(
  if [ -n "$SRM_START_DIR" ]; then cd "$SRM_START_DIR" 2>/dev/null; fi
  exec sh -c "$SRM_COMMAND"
) &
srm_pid=$!
set +m
srm_log "started $SRM_COMMAND"

srm_log "game started"
srm_stage post-launch SRM_POSTLAUNCH

# Wait until the game's processes are gone (and stay gone for a few seconds:
# some games restart themselves).
srm_gone=0
while [ "$srm_gone" -lt 3 ]; do
  if srm_running "$srm_pid"; then srm_gone=0; else srm_gone=$((srm_gone + 1)); fi
  sleep 2
done
wait "$srm_pid" 2>/dev/null
srm_log "game exited"

srm_stage post-exit SRM_POSTEXIT
rm -rf "$SRM_RUN_DIR"
