import yargs from "yargs";
import type { FieldInput } from "../core/parser-commands";
import { parserFieldOptions } from "./cli-parser-options";

export type CliCommand =
  | "list"
  | "enable"
  | "disable"
  | "add"
  | "remove"
  | "nuke"
  | "create-parser"
  | "edit-parser"
  | "delete-parser"
  | "view-parser";

export interface CliRequest {
  command: CliCommand;
  // Parsers, by id or name.
  parsers: string[];
  all: boolean;
  // add/remove: run just `parsers`, enabled or not.
  only: boolean;
  // edit-parser/view-parser: the parser, by id or name.
  parser?: string;
  // create-parser/edit-parser: the settings given, by option name.
  fields?: FieldInput;
  // view-parser: the settings to show (option names; none: all).
  show?: string[];
}

export interface ParseOptions {
  // Exit the process on --help/--version/bad input (the app); tests capture
  // the output instead.
  exitProcess?: boolean;
  print?: (text: string) => void;
}

const steamNote =
  "Close Steam completely before add, remove or nuke. If Steam is " +
  "running, games are still added or removed, but collections aren't updated.";

// The command line. Returns undefined when no command was given (the app
// then opens its window). No colors in the help text: yargs counts escape
// codes when wrapping, which broke lines in odd places.
export function parseCliArgs(
  args: string[],
  { exitProcess = true, print }: ParseOptions = {},
): CliRequest | undefined {
  let request: CliRequest | undefined;
  const parsersOption = (verb: string) => (y: any) =>
    y
      .positional("parsers", {
        describe: `Parsers to ${verb}: ids or names (see "list")`,
        type: "string",
        array: true,
      })
      // Older scripts pass --names; ids and names both work now.
      .option("names", { type: "boolean", hidden: true });
  const set =
    (command: CliCommand) =>
    (argv: any): void => {
      request = {
        command,
        parsers: (argv.parsers ?? []).map(String),
        all: !!argv.all,
        only: !!argv.only,
      };
      if (argv.parser !== undefined) request.parser = String(argv.parser);
      if (command === "create-parser" || command === "edit-parser") {
        request.fields = fieldOptions.given(argv);
      }
      if (command === "view-parser") {
        request.show = Object.entries(fieldOptions.given(argv))
          .filter(([, on]) => on === true)
          .map(([flag]) => flag);
      }
    };
  // Parser settings as options (help and checks come from the shared field
  // catalog, so they match the parser editor).
  const fieldOptions = parserFieldOptions(args);

  const parser = yargs(args)
    .scriptName("srm")
    .usage("Usage: $0 <command> [options]")
    .command(
      "list",
      "List every parser: name, id and whether it's enabled",
      {},
      set("list"),
    )
    .command(
      "enable [parsers..]",
      "Enable parsers in SRM",
      (y: any) =>
        parsersOption("enable")(y)
          .option("all", { describe: "Enable every parser", type: "boolean" })
          .check(needParsersOr("all")),
      set("enable"),
    )
    .command(
      "disable [parsers..]",
      "Disable parsers in SRM",
      (y: any) =>
        parsersOption("disable")(y)
          .option("all", { describe: "Disable every parser", type: "boolean" })
          .check(needParsersOr("all")),
      set("disable"),
    )
    .command(
      "add [parsers..]",
      "Run the enabled parsers (or only the given ones, with --only) and add their games to Steam",
      (y: any) =>
        parsersOption("run")(y)
          .option("only", {
            describe:
              "Run only the given parsers, enabled or not. Doesn't change which parsers are enabled, and leaves other parsers' games in Steam alone",
            type: "boolean",
          })
          .check(onlyNeedsParsers),
      set("add"),
    )
    .command(
      "remove [parsers..]",
      "Run the enabled parsers (or only the given ones, with --only) and remove their games from Steam",
      (y: any) =>
        parsersOption("run")(y)
          .option("only", {
            describe:
              "Run only the given parsers, enabled or not. Doesn't change which parsers are enabled",
            type: "boolean",
          })
          .check(onlyNeedsParsers),
      set("remove"),
    )
    .command(
      "nuke",
      "Remove everything SRM has ever added to Steam, from every parser",
      {},
      set("nuke"),
    )
    .command(
      ["create-parser", "create"],
      "Create a parser. Every setting the parser editor has is an option; see create --help (add --type <type> for just that type's)",
      (y: any) => fieldOptions.declare(y, "create"),
      set("create-parser"),
    )
    .command(
      ["edit-parser <parser>", "edit <parser>"],
      "Change a parser's settings: only the options given, and only to valid values",
      (y: any) =>
        fieldOptions.declare(
          y.positional("parser", {
            describe: 'The parser: its id or its name (see "list")',
            type: "string",
          }),
          "edit",
        ),
      set("edit-parser"),
    )
    .command(
      ["delete-parser <parsers..>", "delete <parsers..>"],
      "Delete parsers (all or none: nothing is deleted if one isn't found)",
      (y: any) =>
        y.positional("parsers", {
          describe: 'Parsers to delete: ids or names (see "list")',
          type: "string",
          array: true,
        }),
      set("delete-parser"),
    )
    .command(
      ["view-parser <parser>", "view <parser>", "show <parser>"],
      "Show a parser's settings: the ones named (e.g. view <parser> --type --name), or all that apply to it",
      (y: any) =>
        fieldOptions.declare(
          y.positional("parser", {
            describe: 'The parser: its id or its name (see "list")',
            type: "string",
          }),
          "view",
        ),
      set("view-parser"),
    )
    .example("$0 list", "")
    .example(
      "$0 add --only 1234567890 2345678901",
      "Add games from two parsers",
    )
    .example('$0 remove --only "Snes9x (SNES)"', "Remove one parser's games")
    .example('$0 enable "Snes9x (SNES)" "Dolphin (GameCube)"', "")
    .example("$0 disable --all", "")
    .example(
      '$0 create --type Glob --name "My SNES" --rom-directory D:/ROMs/SNES --glob "${title}.sfc"',
      "",
    )
    .example('$0 edit "My SNES" --steam-categories "Puzzle" "Fun"', "")
    .example('$0 view "My SNES" --type --rom-directory', "")
    .epilogue(steamNote)
    .wrap(Math.min(100, process.stdout.columns || 100))
    .exitProcess(exitProcess);
  if (print) {
    parser.fail((message: string, error: Error) => {
      throw error ?? new Error(message);
    });
    parser.parse(
      args,
      {},
      (_err: unknown, _argv: unknown, output: string) =>
        output && print(output),
    );
  } else {
    parser.parse();
  }
  return request;
}

function needParsersOr(flag: string) {
  return (argv: any) => {
    if (!argv[flag] && !(argv.parsers ?? []).length) {
      throw new Error(`Name at least one parser, or use --${flag}.`);
    }
    return true;
  };
}

function onlyNeedsParsers(argv: any) {
  const parsers = argv.parsers ?? [];
  if (argv.only && !parsers.length) {
    throw new Error("--only needs at least one parser.");
  }
  if (!argv.only && parsers.length) {
    throw new Error(
      `To run just these parsers use --only (e.g. "add --only ${parsers[0]}").`,
    );
  }
  return true;
}
