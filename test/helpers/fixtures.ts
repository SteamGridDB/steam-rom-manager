import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as _ from "lodash";
import { Validator } from "../../src/lib/helpers/json/validator";
import * as schemas from "../../src/core/schemas";
import * as modifiers from "../../src/core/modifiers";
import { AppSettings, ParserType, UserConfiguration } from "../../src/models";
import { availableParserInputs } from "../../src/lib/parsers/available-parsers";

const shortcutsParser = require("steam-shortcut-editor");
import { accountID_ToSteamID64 } from "../../src/lib/helpers/steam/account-id-to-steam-id-64";

export function tempDir(prefix: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `srm-${prefix}-`));
}

export function writeFiles(root: string, files: string[]) {
  for (const file of files) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, "");
  }
}

// Minimal Steam install: config/loginusers.vdf plus userdata/<id>/config.
// Only what SRM reads/writes; real-format coverage of Steam's own files comes
// from the live tests against an actual install.
//
// With `userContent`, each account also starts with things SRM does NOT own
// and must preserve: a manually added shortcut, a user collection, and a
// manual compat-tool mapping (plus the cloud-storage/config.vdf files SRM's
// category and compat-tool writers need to exist).
export function makeFakeSteam(
  root: string,
  accounts: { accountID: string; name: string }[],
  opts: { userContent?: boolean } = {},
) {
  const users = accounts
    .map(
      ({ accountID, name }) =>
        `\t"${accountID_ToSteamID64(accountID)}"\n\t{\n\t\t"AccountName"\t\t"${name}"\n\t\t"PersonaName"\t\t"${name}"\n\t}\n`,
    )
    .join("");
  fs.mkdirSync(path.join(root, "config"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "config", "loginusers.vdf"),
    `"users"\n{\n${users}}\n`,
  );
  for (const { accountID } of accounts) {
    const config = path.join(root, "userdata", accountID, "config");
    fs.mkdirSync(config, { recursive: true });
    if (opts.userContent) {
      fs.writeFileSync(
        path.join(config, "shortcuts.vdf"),
        shortcutsParser.writeBuffer({
          shortcuts: [
            {
              appid: -1000000001,
              AppName: "My Manual Shortcut",
              Exe: '"C:\\Tools\\manual.exe"',
              StartDir: '"C:\\Tools\\"',
              tags: ["Favorites"],
            },
          ],
        }),
      );
      fs.writeFileSync(
        path.join(config, "localconfig.vdf"),
        '"UserLocalConfigStore"\n{\n\t"apps"\n\t{\n\t\t"440"\n\t\t{\n\t\t\t"UseSteamControllerConfig"\t\t"2"\n\t\t}\n\t}\n}\n',
      );
      const cloud = path.join(config, "cloudstorage");
      fs.mkdirSync(cloud, { recursive: true });
      fs.writeFileSync(
        path.join(cloud, "cloud-storage-namespaces.json"),
        JSON.stringify([[1, "1"]]),
      );
      const userCollection = {
        id: "uc-mine",
        name: "My Collection",
        added: [440],
        removed: [] as number[],
      };
      fs.writeFileSync(
        path.join(cloud, "cloud-storage-namespace-1.json"),
        JSON.stringify([
          [
            "user-collections.uc-mine",
            {
              key: "user-collections.uc-mine",
              timestamp: 1700000000,
              value: JSON.stringify(userCollection),
              version: "1",
            },
          ],
        ]),
      );
    }
  }
  if (opts.userContent) {
    fs.writeFileSync(
      path.join(root, "config", "config.vdf"),
      [
        '"InstallConfigStore"',
        "{",
        '\t"Software"',
        "\t{",
        '\t\t"Valve"',
        "\t\t{",
        '\t\t\t"Steam"',
        "\t\t\t{",
        '\t\t\t\t"CompatToolMapping"',
        "\t\t\t\t{",
        '\t\t\t\t\t"440"',
        "\t\t\t\t\t{",
        '\t\t\t\t\t\t"name"\t\t"proton_8"',
        '\t\t\t\t\t\t"config"\t\t""',
        '\t\t\t\t\t\t"priority"\t\t"250"',
        "\t\t\t\t\t}",
        "\t\t\t\t}",
        "\t\t\t}",
        "\t\t}",
        "\t}",
        "}",
        "",
      ].join("\n"),
    );
  }
  return root;
}

// Build configs/settings the way the app does: run (partial) user data
// through the real schema + migration modifiers so defaults are filled in.
const replaceArrays = (_obj: any, src: any) =>
  Array.isArray(src) ? src : undefined;

// Mirrors the app's lifecycle for a new parser: the form starts from
// ParsersService.getDefaultValues(), the user edits it, saving strips inputs
// that don't belong to the parser type, and loading validates it.
export function makeConfig(
  partial: Partial<UserConfiguration> | object,
): UserConfiguration {
  const defaults = new Validator(
    schemas.defaultUserConfiguration,
    modifiers.userConfiguration,
  ).getDefaultValues();
  const data: any = _.mergeWith(defaults, _.cloneDeep(partial), replaceArrays);
  const allowedInputs: string[] =
    availableParserInputs[data.parserType as ParserType] ?? [];
  for (const key of Object.keys(data.parserInputs ?? {})) {
    if (!allowedInputs.includes(key)) delete data.parserInputs[key];
  }
  const validator = new Validator(
    schemas.userConfiguration,
    modifiers.userConfiguration,
  );
  if (!validator.validate(data).isValid()) {
    throw new Error(`Invalid test config:\n${validator.errorString}`);
  }
  return data as UserConfiguration;
}

// Same as SettingsService: start from schema defaults, overlay user data.
export function makeSettings(partial: object = {}): AppSettings {
  const validator = new Validator(schemas.appSettings, modifiers.appSettings);
  const data = _.merge(validator.getDefaultValues(), _.cloneDeep(partial));
  validator.validate(data);
  return data as AppSettings;
}

// Make parser output machine-independent: swap temp roots for tokens and
// normalize path separators.
export function normalize<T>(value: T, roots: { [token: string]: string }): T {
  let json = JSON.stringify(value);
  const variants = (p: string) => [
    p,
    p.replaceAll("\\", "/"),
    JSON.stringify(p).slice(1, -1),
  ];
  for (const [token, root] of Object.entries(roots)) {
    for (const variant of _.uniq(
      variants(fs.realpathSync(root)).concat(variants(root)),
    )) {
      json = json.split(variant).join(`<${token}>`);
    }
  }
  json = json.replaceAll("\\\\", "/");
  return JSON.parse(json);
}
