import yargs from "yargs";

export type CliCommand =
  | "list"
  | "enable"
  | "disable"
  | "add"
  | "remove"
  | "nuke";

export interface CliRequest {
  command: CliCommand;
  // Parser ids, or names with `names`.
  parsers: string[];
  all: boolean;
  names: boolean;
  // add/remove: run just `parsers`, enabled or not.
  only: boolean;
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
        describe: `Parsers to ${verb}: ids (see "list"), or names with --names`,
        type: "string",
        array: true,
      })
      .option("names", {
        describe: "Match parsers by name (emoji left out) instead of id",
        type: "boolean",
      });
  const set =
    (command: CliCommand) =>
    (argv: any): void => {
      request = {
        command,
        parsers: (argv.parsers ?? []).map(String),
        all: !!argv.all,
        names: !!argv.names,
        only: !!argv.only,
      };
    };

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
    .example("$0 list", "")
    .example(
      "$0 add --only 1234567890 2345678901",
      "Add games from two parsers",
    )
    .example(
      '$0 remove --only --names "Snes9x (SNES)"',
      "Remove one parser's games",
    )
    .example('$0 enable --names "Snes9x (SNES)" "Dolphin (GameCube)"', "")
    .example("$0 disable --all", "")
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
