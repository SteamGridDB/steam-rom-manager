import { spawn, execSync } from "child_process";
import * as os from "os";
import { AppSettings } from "../../../models";
import { LoggerService } from "../../../renderer/services";

const checkDelay = 500;
const timeout = 60000;

// Track if Steam was killed so we can restart it on app exit
let steamWasKilled = false;
export function wasSteamKilled(): boolean {
  return steamWasKilled;
}
export function resetSteamKilledFlag(): void {
  steamWasKilled = false;
}

interface ActAndCheck {
  commands: {
    action: string;
    check: string;
  };
  messages: {
    prefix: string;
    success: string;
    failure: string;
    precheckPassed: string;
  };
  checkOutput: string;
  shell: string;
  safetyDelay: number;
}

async function actAndCheck(data: ActAndCheck) {
  return await new Promise<{ acted: boolean; messages: string[] }>(
    (resolve, reject) => {
      let messages: string[] = [];
      const precheck = execSync(data.commands.check, { shell: data.shell })
        .toString()
        .trim();
      if (precheck == data.checkOutput) {
        resolve({ acted: false, messages: [data.messages.precheckPassed] });
      } else {
        const proc = spawn(data.commands.action, { shell: data.shell });
        proc.stdout.on("data", (procData) => {
          messages.push(
            `${data.messages.prefix}: ${procData.toString("utf8")}`,
          );
        });
        proc.stderr.on("data", (procErr) => {
          messages.push(
            `${data.messages.prefix} (Error): ${procErr.toString("utf8")}`,
          );
        });
        proc.on("close", () => {
          let elapsed = 0;
          let interval: NodeJS.Timeout = setInterval(() => {
            const check = execSync(data.commands.check, { shell: data.shell })
              .toString()
              .trim();
            if (check == data.checkOutput) {
              clearTimeout(interval);
              let delay = setTimeout(() => {
                clearTimeout(delay);
                messages.push(
                  data.messages.success.interpolate({
                    elapsed: elapsed + data.safetyDelay,
                  }),
                );
                resolve({ acted: true, messages: messages });
              }, data.safetyDelay);
            }
            if (elapsed > timeout) {
              reject(data.messages.failure.interpolate({ timeout }));
              clearTimeout(interval);
            }
            elapsed += checkDelay;
          }, checkDelay);
        });
      }
    },
  );
}

// try to kill steam
export async function stopSteam() {
  let data: ActAndCheck = {
    commands: null,
    messages: {
      prefix: "Killing Steam",
      success: "Killed Steam after ${elapsed}ms.",
      failure: "Failed to kill Steam within ${timeout}ms.",
      precheckPassed: "Steam is not running, no need to kill it.",
    },
    checkOutput: "True",
    safetyDelay: 2000,
    shell: null,
  };
  if (os.type() == "Windows_NT") {
    data.commands = {
      action:
        'Start-Process "${env:PROGRAMFILES(X86)}\\Steam\\steam.exe" "-shutdown"',
      check: `(Get-Process steam -ErrorAction SilentlyContinue) -eq $null`,
    };
    data.shell = "powershell";
  } else if (os.type() == "Linux") {
    data.commands = {
      action: `kill -15 $(pidof -x steam) 2>/dev/null || true`,
      check: `steam_pid=$(pgrep -x '^steam$' 2>/dev/null); if [ -z "$steam_pid" ]; then echo "True"; else echo "False"; fi`,
    };
    data.shell = "/bin/sh";
  } else if (os.type() == "Darwin") {
    data.commands = {
      action: `osascript -e 'quit app "Steam"'`,
      check: `pid="$(pgrep steam_osx)"; if [ -z $pid ]; then echo "True"; else echo "False"; fi;`,
    };
    data.shell = "/bin/sh";
  }
  return await actAndCheck(data);
}

//try to restart steam
export async function startSteam() {
  let data: ActAndCheck = {
    commands: null,
    messages: {
      prefix: "Starting Steam",
      success: "Started Steam after ${elapsed}ms.",
      failure: "Failed to start Steam within ${timeout}ms.",
      precheckPassed: "Steam is already running, no need to start it.",
    },
    checkOutput: "True",
    safetyDelay: 0,
    shell: null,
  };
  if (os.type() == "Windows_NT") {
    data.commands = {
      action:
        'Start-Process -WindowStyle Minimized ${env:PROGRAMFILES(x86)}\\Steam\\steam.exe -ArgumentList "-silent"',
      check: `(Get-Process steam -ErrorAction SilentlyContinue) -ne $null`,
    };
    data.shell = "powershell";
  } else if (os.type() == "Linux") {
    data.commands = {
      action: `2>/dev/null 1>&2 steam -silent &`,
      check: `pid="$(pidof steam)"; if [ ! -z $pid ]; then echo "True"; else echo "False"; fi;`,
    };
    data.shell = "/bin/sh";
  } else if (os.type() == "Darwin") {
    data.commands = {
      action: "open -g -a Steam",
      check:
        'pid="$(pgrep steam_osx)"; if [ ! -z $pid ]; then echo "True"; else echo "False"; fi;',
    };
    data.shell = "/bin/sh";
  }
  return await actAndCheck(data);
}

export async function performSteamlessTask(
  appSettings: AppSettings,
  loggerService: LoggerService,
  task: () => Promise<void>,
  successMessage?: string,
) {
  let stop: { acted: boolean; messages: string[] } = { acted: false, messages: [] };

  // Kill Steam if auto-kill is enabled
  if (appSettings.autoKillSteam) {
    loggerService.info("Attempting to kill Steam.", {
      invokeAlert: true,
      alertTimeout: 3000,
    });
    try {
      stop = await stopSteam();
      for (let message of stop.messages) {
        loggerService.info(message);
      }

      // Track that Steam was killed (so we can restart on app exit if needed)
      if (stop.acted) {
        steamWasKilled = true;
      }
    } catch (error) {
      loggerService.error(`Failed to stop Steam: ${error}`, {
        invokeAlert: true,
        alertTimeout: 5000,
      });
      throw error; // Re-throw so the category write doesn't proceed
    }
  }

  // Perform the task (VDF writes + category writes)
  loggerService.info("Writing shortcuts, artwork, and categories to Steam...");
  try {
    await task();
    loggerService.info("Finished writing all data to Steam.");
  } catch (error) {
    loggerService.error(`Failed to write data to Steam: ${error.message}`);
    throw error;
  }

  // Restart Steam if auto-restart is enabled AND we actually killed it
  if (appSettings.autoRestartSteam && stop.acted) {
    loggerService.info("Attempting to restart Steam...", {
      invokeAlert: true,
      alertTimeout: 3000,
    });
    try {
      const start = await startSteam();
      for (let message of start.messages) {
        loggerService.info(message);
      }
      // Show success notification after Steam actually starts
      if (start.acted) {
        loggerService.info("Restarted Steam successfully.", {
          invokeAlert: true,
          alertTimeout: 3000,
          doNotAppendToLog: true,
        });
        steamWasKilled = false;
      }
    } catch (error) {
      loggerService.error(`Failed to restart Steam: ${error}`, {
        invokeAlert: true,
        alertTimeout: 5000,
      });
      // Don't re-throw - we want the category save to have succeeded even if restart fails
    }
  }

  // Display final success message after Steam restart completes (or immediately if no restart)
  if (successMessage) {
    loggerService.success(successMessage, {
      invokeAlert: true,
      alertTimeout: 3000,
      doNotAppendToLog: true,
    });
  }
}
