// Reads a parser's SQLite database (GOG Galaxy, Amazon Games, itch.io)
// with Node's own node:sqlite: no native module to build, in the app or the
// standalone command line.
export type SqliteTask = "gog-galaxy" | "amazon-games" | "itch.io";

export class SqliteWrapper {
  constructor(
    private task: SqliteTask,
    private dbPath: string,
    private options: { [k: string]: any } = {},
  ) {}

  // (async for the parsers, which used to wait on a worker process)
  async read(): Promise<any[]> {
    const { DatabaseSync } = require("node:sqlite");
    // read-only: the launchers may have their databases open
    const db = new DatabaseSync(this.dbPath, { readOnly: true });
    try {
      return runTask(db, this.task, this.options);
    } finally {
      db.close();
    }
  }
}

interface Db {
  prepare(sql: string): { all(): any[] };
}

function runTask(db: Db, task: SqliteTask, options: { [k: string]: any }) {
  switch (task) {
    case "gog-galaxy": {
      // (only the columns used, and ids as text: GOG user ids and linked
      // games' product ids are integers too big for a JS number, which
      // node:sqlite refuses to read and parseInt rounds)
      const details = db
        .prepare(
          "select cast(productId as text) as productId, title from LimitedDetails",
        )
        .all();
      const playtaskparams = db
        .prepare(
          "select playTaskId, executablePath, commandLineArgs from PlayTaskLaunchParameters",
        )
        .all();
      return db
        .prepare("select id, gameReleaseKey, isPrimary from PlayTasks")
        .all()
        .map((x) =>
          Object.assign(x, {
            productId: x.gameReleaseKey.split("_").pop(),
            productType: x.gameReleaseKey.split("_")[0],
          }),
        )
        .filter(
          (x) =>
            x.productType == "gog" ||
            (options.externals && x.productType == "generic"),
        )
        .filter((x) => x.isPrimary)
        .map((x) => {
          x.params = playtaskparams.filter((y) => y.playTaskId == x.id)[0];
          const xdetails = details.filter((y) => y.productId === x.productId);
          if (xdetails.length && xdetails[0]) {
            x.title = xdetails[0].title;
          }
          return x;
        });
    }
    case "amazon-games":
      return db
        .prepare(
          "select ProductTitle, InstallDirectory, Installed, Id from DbSet",
        )
        .all();
    case "itch.io":
      return db
        .prepare(
          "select title, verdict from caves as c join games as g on c.game_id = g.id",
        )
        .all();
  }
}
