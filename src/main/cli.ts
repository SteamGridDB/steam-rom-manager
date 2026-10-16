import * as clc from "cli-color";
import { Logger, UserConfiguration } from "../models";
import { Core } from "../core/core";
import * as commands from "../core/cli-commands";
import * as parsers from "../core/parser-commands";
import { CliRequest } from "./cli-args";

const text = (message: any) =>
  message instanceof Error ? message.message : String(message);

// Runs a CLI command headless, in this (main) process. Returns the exit code.
export async function runCli(request: CliRequest): Promise<number> {
  const { command } = request;
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
    error: (message) =>
      process.stderr.write(`${clc.xterm(203)(text(message))}\n`),
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
            commands
              .list(core)
              .map((parser) => [
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
      ok = await commands.setEnabled(core, out, command === "enable", request);
      break;
    case "add":
      ok = await commands.add(core, out, onlyOption(request));
      break;
    case "remove":
      ok = await commands.remove(core, out, onlyOption(request));
      break;
    case "nuke":
      ok = await commands.nuke(core, out);
      break;
    case "create-parser":
    case "edit-parser":
    case "delete-parser":
    case "view-parser":
      return parserCommand(core, request, out);
  }
  core.fuzzy.stopAutoSave();
  await core.fuzzy.saveCacheIfNeeded();
  if (ok) {
    out.log("\nAll Done");
  }
  return ok ? 0 : 1;
}

const red = (line: string) => clc.xterm(203)(line);
const green = (line: string) => clc.xterm(48)(line);
const yellow = (line: string) => clc.xterm(221)(line);
const titled = (config: UserConfiguration) =>
  `"${config.configTitle}" (id ${config.parserId})`;

// create/edit/delete/show a parser. Returns the exit code.
async function parserCommand(
  core: Core,
  request: CliRequest,
  out: commands.CliOutput,
): Promise<number> {
  const fail = (errors: string[]) => {
    for (const error of errors) process.stderr.write(`${red(error)}\n`);
    return 1;
  };
  switch (request.command) {
    case "create-parser": {
      const result = await parsers.createParser(core, request.fields ?? {});
      if (!result.ok) return fail(result.errors);
      out.log(green(`Created parser ${titled(result.value)}`));
      return 0;
    }
    case "edit-parser": {
      const result = await parsers.editParser(
        core,
        request.parser,
        request.fields ?? {},
      );
      if (!result.ok) return fail(result.errors);
      const { config, changed, problems } = result.value;
      out.log(green(`Updated ${titled(config)}: ${changed.join(", ")}`));
      if (problems.length) {
        out.log(yellow("This parser still has problems (not changed here):"));
        for (const problem of problems) out.log(yellow(`  ${problem}`));
      }
      return 0;
    }
    case "delete-parser": {
      const result = parsers.deleteParsers(core, request.parsers);
      if (!result.ok) return fail(result.errors);
      for (const config of result.value) {
        out.log(`Deleted parser ${titled(config)}`);
      }
      return 0;
    }
    case "view-parser": {
      const result = parsers.viewParser(core, request.parser, request.show);
      if (!result.ok) return fail(result.errors);
      const { config, rows } = result.value;
      // One setting: just its value, for scripts.
      if (request.show?.length === 1) {
        const [row] = rows;
        if (row.unused) return fail([row.unused]);
        if (row.raw) out.log(row.raw);
        return 0;
      }
      out.log(`${titled(config)}, a ${config.parserType} parser`);
      out.log(
        clc.columns(
          [[clc.blue("Option"), clc.blue("Setting"), clc.blue("Value")]].concat(
            rows.map((row) => [
              row.required ? `${row.flag} *` : row.flag,
              row.label,
              row.unused ? clc.blackBright(`(${row.unused})`) : row.value,
            ]),
          ),
        ),
      );
      if (rows.some((row) => row.required)) out.log("* required");
      return 0;
    }
  }
  return 1;
}

function onlyOption({ only, parsers }: CliRequest) {
  return only ? { only: parsers } : {};
}
