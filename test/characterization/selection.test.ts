// Exporting the chosen artwork to an srm-image-choices folder and importing
// it again in a later session.
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  makeConfig,
  makeFakeSteam,
  makeSettings,
  tempDir,
  writeFiles,
} from "../helpers/fixtures";
import {
  makePreviewService,
  startImageServer,
} from "../helpers/preview-harness";

describe("artwork selection export/import", () => {
  let imageServer: Awaited<ReturnType<typeof startImageServer>>;
  let root: string;

  beforeAll(async () => {
    imageServer = await startImageServer();
  });
  afterAll(() => imageServer.close());
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    root = tempDir("selection");
    writeFiles(root, ["roms/Super Mario World (USA).sfc"]);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  function harness(artwork: boolean) {
    const steamDir = makeFakeSteam(path.join(root, "steam"), [
      { accountID: "11111111", name: "alice" },
    ]);
    const config = makeConfig({
      parserType: "Glob",
      configTitle: "SNES",
      romDirectory: path.join(root, "roms"),
      steamDirectory: steamDir,
      executable: { path: "/emu/snes9x" },
      parserInputs: { glob: "${title}.sfc" },
      titleModifier: "${fuzzyTitle}",
    });
    return makePreviewService({
      configs: [config],
      settings: makeSettings(),
      knownSteamDirectories: [steamDir],
      imageBase: imageServer.base,
      artwork: artwork ? { "Super Mario World": { gameId: "1001" } } : {},
      fuzzyList: ["Super Mario World"],
    });
  }

  const onlyApp = (data: any) =>
    Object.values(Object.values(Object.values(data)[0])[0].apps)[0] as any;

  it("exports the current artwork and imports it as the selection", async () => {
    const first = harness(true);
    await first.generate();
    const out = path.join(root, "export");
    fs.mkdirSync(out);
    await first.service.exportSelection(out);
    const pkg = path.join(out, "srm-image-choices");
    const selections = JSON.parse(
      fs.readFileSync(path.join(pkg, "_selections.json"), "utf8"),
    );
    expect(selections).toHaveLength(1);
    expect(selections[0].title).toBe("Super Mario World (USA)");
    expect(
      Object.keys(selections[0].images).filter((t) => selections[0].images[t]),
    ).toHaveLength(5);
    expect(fs.readdirSync(pkg).filter((f) => f.endsWith(".png"))).toHaveLength(
      5,
    );

    // later session, no online artwork: the imported images get selected
    const second = harness(false);
    await second.generate();
    await second.service.importSelection(pkg);
    const app = onlyApp(second.service.getPreviewData());
    for (const type of ["tall", "long", "hero", "logo", "icon"] as const) {
      const image = second.service.getCurrentImage(app, type);
      expect(image.imageProvider).toBe("Imported Artwork");
      expect(decodeURI(image.imageUrl)).toContain("srm-image-choices");
    }
    expect(second.log.filter((l) => l.level === "error")).toEqual([]);
  });

  it("reports an unreadable selections file", async () => {
    const h = harness(false);
    await h.generate();
    const pkg = path.join(root, "bad");
    fs.mkdirSync(pkg);
    fs.writeFileSync(path.join(pkg, "_selections.json"), "{ nope");
    await h.service.importSelection(pkg);
    expect(h.log.some((l) => l.level === "error")).toBe(true);
  });
});
