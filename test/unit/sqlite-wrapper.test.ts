// The parsers' SQLite reads, through Node's own node:sqlite.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { SqliteWrapper } from "../../src/lib/helpers/sqlite/sqlite-wrapper";
import { tempDir } from "../helpers/fixtures";

const { DatabaseSync } = require("node:sqlite");

describe("SqliteWrapper", () => {
  let root: string;
  beforeEach(() => {
    root = tempDir("sqlite");
  });
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function makeDb(file: string, sql: string) {
    const dbPath = path.join(root, file);
    const db = new DatabaseSync(dbPath);
    db.exec(sql);
    db.close();
    return dbPath;
  }

  it("GOG Galaxy: primary play tasks with their titles and launch parameters", async () => {
    // (Galaxy's columns; a GOG user id doesn't fit in a JS number)
    const dbPath = makeDb(
      "galaxy-2.0.db",
      `create table LimitedDetails (id integer, productId integer, languageId integer, is_production integer, stored_at text, title text, links text, images text);
       create table PlayTasks (id integer, gameReleaseKey text, userId integer, "order" integer, typeId integer, isPrimary integer);
       create table PlayTaskLaunchParameters (playTaskId integer, executablePath text, commandLineArgs text, label text);
       insert into LimitedDetails (productId, title) values (1, 'Witcher'), (51141384418629514, 'Other');
       insert into PlayTasks (id, gameReleaseKey, userId, isPrimary) values
         (10, 'gog_1', 51418510460311286, 1), (11, 'gog_1', 51418510460311286, 0), (12, 'generic_51141384418629514', 51418510460311286, 1);
       insert into PlayTaskLaunchParameters (playTaskId, executablePath, commandLineArgs) values
         (10, 'C:/witcher.exe', '-fast'), (12, 'C:/other.exe', null);`,
    );
    const rows = (await new SqliteWrapper("gog-galaxy", dbPath, {
      externals: false,
    }).read()) as any[];
    expect(rows.map((r) => ({ ...r, params: { ...r.params } }))).toEqual([
      {
        id: 10,
        gameReleaseKey: "gog_1",
        isPrimary: 1,
        productId: "1",
        productType: "gog",
        title: "Witcher",
        params: {
          playTaskId: 10,
          executablePath: "C:/witcher.exe",
          commandLineArgs: "-fast",
        },
      },
    ]);
    const withExternals = (await new SqliteWrapper("gog-galaxy", dbPath, {
      externals: true,
    }).read()) as any[];
    expect(withExternals.map((r) => r.title)).toEqual(["Witcher", "Other"]);
    // (a linked game's id, exactly: it goes into the launch options)
    expect(withExternals[1].productId).toBe("51141384418629514");
  });

  it("Amazon Games and itch.io", async () => {
    const amazon = makeDb(
      "amazon.sqlite",
      `create table DbSet (ProductTitle text, InstallDirectory text, Installed integer, Id text);
       insert into DbSet values ('Game', 'C:/game', 1, 'amzn1');`,
    );
    expect(await new SqliteWrapper("amazon-games", amazon).read()).toEqual([
      expect.objectContaining({ ProductTitle: "Game", Id: "amzn1" }),
    ]);
    const itch = makeDb(
      "butler.db",
      `create table games (id integer, title text);
       create table caves (game_id integer, verdict text);
       insert into games values (1, 'Celeste');
       insert into caves values (1, '{"basePath":"C:/celeste"}');`,
    );
    expect(await new SqliteWrapper("itch.io", itch).read()).toEqual([
      expect.objectContaining({ title: "Celeste" }),
    ]);
  });
});
