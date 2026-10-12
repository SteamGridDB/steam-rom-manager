// Live drift checks against a real Steam install and SRM userData. These catch
// Steam changing its file formats under us, which fixture-based tests can't.
// Local only: skipped unless the env vars below are set. Read-only: anything
// written goes to a temp copy, never the real install.
//
//   SRM_LIVE_STEAM_DIR   e.g. C:\Program Files (x86)\Steam
//   SRM_LIVE_ACCOUNT_ID  e.g. 84977612 (folder under userdata)
//   SRM_LIVE_USERDATA    e.g. %APPDATA%\steam-rom-manager\userData (optional)
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import * as genericParser from "@node-steam/vdf";
import { VDF_ShortcutsFile } from "../../src/lib/vdf-shortcuts-file";
import {
  generateAppId,
  generateShortcutId,
} from "../../src/lib/helpers/steam/generate-app-id";
import { getAvailableLogins } from "../../src/lib/helpers/steam/get-available-logins";
import { Validator } from "../../src/lib/helpers/json/validator";
import * as schemas from "../../src/renderer/schemas";
import * as modifiers from "../../src/renderer/modifiers";
import { tempDir } from "../helpers/fixtures";

const steamDir = process.env.SRM_LIVE_STEAM_DIR;
const accountId = process.env.SRM_LIVE_ACCOUNT_ID;
const srmUserData = process.env.SRM_LIVE_USERDATA;
const userConfigDir = () =>
  path.join(steamDir!, "userdata", accountId!, "config");

// Semantic round-trip for text VDF, the way SRM rewrites these files.
// (Not byte-exact: JS objects hoist integer-like keys, so numeric sections
// get re-sorted on every write. Steam tolerates this.)
function expectVdfRoundTrip(file: string) {
  const text = fs.readFileSync(file, "utf8");
  const parsed = genericParser.parse(text);
  const reparsed = genericParser.parse(genericParser.stringify(parsed));
  expect(reparsed).toEqual(parsed);
}

describe.skipIf(!steamDir || !accountId)("live Steam install", () => {
  let scratch: string;
  beforeAll(() => {
    scratch = tempDir("live");
  });
  afterAll(() => fs.rmSync(scratch, { recursive: true, force: true }));

  it("finds the account via loginusers.vdf", async () => {
    const logins = await getAvailableLogins(steamDir!);
    expect(logins.map((l) => l.accountID)).toContain(accountId);
  });

  it("shortcuts.vdf survives a read/write cycle byte-for-byte", async () => {
    const original = fs.readFileSync(
      path.join(userConfigDir(), "shortcuts.vdf"),
    );
    const copy = path.join(scratch, "shortcuts.vdf");
    fs.writeFileSync(copy, original);
    const vdf = new VDF_ShortcutsFile(copy);
    await vdf.read();
    await vdf.write();
    expect(Buffer.compare(fs.readFileSync(copy), original)).toBe(0);
  });

  it("every SRM-added shortcut has the app id SRM would generate", async () => {
    const added = JSON.parse(
      fs.readFileSync(path.join(userConfigDir(), "addedItemsV2.json"), "utf8"),
    );
    const vdf = new VDF_ShortcutsFile(
      path.join(userConfigDir(), "shortcuts.vdf"),
    );
    const shortcuts = (await vdf.read()) as any[];
    const byLongId = new Map(
      shortcuts.map((s) => [generateAppId(s.exe, s.appname), s]),
    );
    const srmIds = Object.entries(added.addedApps)
      .filter(([, info]: [string, any]) => !info.artworkOnly)
      .map(([id]) => id);
    expect(srmIds.length).toBeGreaterThan(0);

    // addedItemsV2 intentionally keeps entries whose shortcuts are gone (e.g.
    // from disabled/deleted parsers): a stale entry is harmless, while
    // wrongly forgetting an SRM-owned shortcut leads to duplicates. So only
    // assert on entries that still have a shortcut.
    const present = srmIds.filter((id) => byLongId.has(id));
    const stale = srmIds.length - present.length;
    if (stale) {
      console.info(
        `addedItemsV2: ${stale}/${srmIds.length} tracked shortcuts no longer in shortcuts.vdf`,
      );
    }
    expect(present.length).toBeGreaterThan(0);
    const wrongShortcutId = present
      .map((id) => byLongId.get(id))
      .filter((s) => s.appid !== generateShortcutId(s.exe, s.appname))
      .map((s) => s.appname);
    expect(wrongShortcutId).toEqual([]);
  });

  it("localconfig.vdf round-trips through the VDF library", () => {
    expectVdfRoundTrip(path.join(userConfigDir(), "localconfig.vdf"));
  });

  it("config.vdf round-trips and keeps the CompatToolMapping shape", () => {
    const file = path.join(steamDir!, "config", "config.vdf");
    expectVdfRoundTrip(file);
    const parsed: any = genericParser.parse(fs.readFileSync(file, "utf8"));
    const mapping = _.get(parsed, [
      "InstallConfigStore",
      "Software",
      "Valve",
      "Steam",
      "CompatToolMapping",
    ]);
    if (mapping) {
      for (const entry of Object.values(mapping) as any[]) {
        expect(entry).toHaveProperty("name");
      }
    }
  });

  it("cloud-storage collections parse as SRM expects", () => {
    const dir = path.join(userConfigDir(), "cloudstorage");
    if (!fs.existsSync(dir)) return;
    const files = fs
      .readdirSync(dir)
      .filter((f) => /^cloud-storage-namespace-\d+\.json$/.test(f));
    for (const f of files) {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      expect(Array.isArray(data)).toBe(true);
      for (const item of data) {
        if (item?.[0]?.startsWith("user-collections.") && !item[1].is_deleted) {
          const collection = JSON.parse(item[1].value);
          expect(collection).toHaveProperty("id");
        }
      }
    }
  });
});

describe.skipIf(!srmUserData)("live SRM userData", () => {
  const read = (name: string) =>
    JSON.parse(fs.readFileSync(path.join(srmUserData!, name), "utf8"));

  it("userSettings.json validates against the current schema", () => {
    const validator = new Validator(schemas.appSettings, modifiers.appSettings);
    expect(validator.validate(read("userSettings.json")).errorString).toBe("");
  });

  it("every parser in userConfigurations.json validates", () => {
    const validator = new Validator(
      schemas.userConfiguration,
      modifiers.userConfiguration,
    );
    const errors = (read("userConfigurations.json") as any[])
      .map((config) => ({
        title: config.configTitle,
        error: validator.validate(config).errorString,
      }))
      .filter((r) => r.error);
    expect(errors).toEqual([]);
  });

  it("userExceptions.json validates", () => {
    const validator = new Validator(
      schemas.userExceptions,
      modifiers.userExceptions,
    );
    expect(validator.validate(read("userExceptions.json")).errorString).toBe(
      "",
    );
  });
});
