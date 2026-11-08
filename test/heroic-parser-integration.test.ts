// Integration: the Heroic parser through the real file-parser pipeline
// (catches wiring like the launcherMode input list in file-parser.ts).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs-extra";
import * as path from "path";
import { ParsersService } from "../src/renderer/services/parsers.service";
import { SettingsService } from "../src/renderer/services/settings.service";
import { Core } from "../src/core/core";
import { hostCore } from "../src/core/rpc-host";
import { CoreClient } from "../src/renderer/core-client";
import { makeRpcPair } from "./helpers/rpc-pair";
import { makeFakeNetwork } from "./helpers/fake-network";
import * as paths from "../src/paths";
import * as modifiers from "../src/core/modifiers";
import { AppSettings } from "../src/models";
import {
  makeConfig,
  makeFakeSteam,
  makeSettings,
  tempDir,
} from "./helpers/fixtures";
import {
  loaded,
  makeLogger,
  settleCoresAfterEach,
} from "./helpers/services-harness";

describe("Heroic end-to-end repro", () => {
  let root: string;
  let steamDir: string;
  let settings: AppSettings;
  let heroicDir: string;

  beforeEach(() => {
    root = tempDir("heroic-e2e");
    steamDir = makeFakeSteam(path.join(root, "steam"), [
      { accountID: "11111111", name: "alice" },
    ]);
    settings = makeSettings();
    fs.rmSync(paths.userConfigurations, { force: true });

    heroicDir = path.join(root, "heroic");
    fs.outputJsonSync(path.join(heroicDir, "gog_store", "installed.json"), {
      installed: [
        {
          appName: "2044653500",
          install_path: path.join(root, "games", "short-hike"),
          executable: "",
          is_dlc: false,
          platform: "windows",
        },
      ],
    });
    fs.outputJsonSync(
      path.join(root, "games", "short-hike", "goggame-2044653500.info"),
      { name: "A Short Hike" },
    );
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  const settled = settleCoresAfterEach(afterEach);

  function makeService() {
    fs.writeFileSync(paths.userSettings, JSON.stringify(settings));
    const logger = makeLogger();
    const core = new Core({ logger: logger.service, fetch: makeFakeNetwork() });
    settled(core).start({ presets: false });
    const { host, client } = makeRpcPair();
    hostCore(core, host);
    const coreClient = { client: new CoreClient(client) } as any;
    const settingsService = new SettingsService(coreClient);
    return new ParsersService(coreClient, settingsService);
  }

  it("launcher mode end-to-end", async () => {
    fs.writeFileSync(
      paths.userConfigurations,
      JSON.stringify([
        makeConfig({
          parserType: "Heroic",
          configTitle: "Heroic",
          parserId: "id-heroic",
          steamDirectory: steamDir,
          parserInputs: {
            heroicAppDataOverride: heroicDir,
            heroicLauncherMode: true,
          },
          executable: { path: "/usr/bin/heroic" },
        }),
      ]),
    );
    const service = makeService();
    await loaded(service);
    const result = await service.executeFileParser();
    console.log(
      "RESULT-JSON:" + JSON.stringify(result.parsedData.parsedConfigs[0].files),
    );
    expect(result.parsedData.parsedConfigs[0].files).toHaveLength(1);
  });
});
