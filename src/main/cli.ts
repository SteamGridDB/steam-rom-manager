import * as clc from "cli-color";
import { Logger } from "../models";
import { Core } from "../core/core";
import * as commands from "../core/cli-commands";

export type CliCommand =
  | "list"
  | "enable"
  | "disable"
  | "add"
  | "remove"
  | "nuke";

const text = (message: any) =>
  message instanceof Error ? message.message : String(message);

// Runs a CLI command headless, in this (main) process. Returns the exit code.
export async function runCli(
  command: CliCommand,
  args: string[],
  flags: { [k: string]: boolean },
): Promise<number> {
  const out: commands.CliOutput = {
    log: (line) => process.stdout.write(`${line}\n`),
    inline: (line) => {
      process.stdout.write(clc.erase.line);
      process.stdout.write(clc.move.lineBegin);
      process.stdout.write(line);
    },
  };
  // Errors go to stderr; the UI-oriented info/success chatter is dropped.
  const logger: Logger = {
    info: () => {},
    success: () => {},
    fuzzy: () => {},
    error: (message) => process.stderr.write(`${clc.xterm(203)(text(message))}\n`),
  };
  // Some lib code logs debugging output with console.log; keep it out of the
  // command's output.
  console.log = () => {};
  console.warn = () => {};

  const core = new Core({ logger });
  await core.load({ presets: false });

  let ok = true;
  switch (command) {
    case "list":
      out.log(
        clc.columns(
          [
            [
              clc.blue("Parser Title (w/o emoji)"),
              clc.blue("Parser ID"),
              clc.blue("Status"),
            ],
          ].concat(
            commands.list(core).map((parser) => [
              parser.configTitle.replace(/[^\x20-\x7E]+/g, ""),
              parser.parserId,
              parser.disabled
                ? clc.xterm(203)("Disabled")
                : clc.xterm(48)("Enabled"),
            ]),
          ),
        ),
      );
      return 0;
    case "enable":
    case "disable":
      await commands.setEnabled(core, out, command === "enable", {
        all: !!flags.all,
        names: !!flags.names,
        parsers: args,
      });
      break;
    case "add":
      ok = await commands.add(core, out);
      break;
    case "remove":
      ok = await commands.remove(core, out);
      break;
    case "nuke":
      ok = await commands.nuke(core, out);
      break;
  }
  core.fuzzy.stopAutoSave();
  await core.fuzzy.saveCacheIfNeeded();
  out.log("\nAll Done");
  return ok ? 0 : 1;
}
