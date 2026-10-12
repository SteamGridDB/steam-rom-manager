// A fake fetch that answers SRM's GitHub requests (git trees API, raw files,
// presetsHashes.json) from this repository's own files/ folder, or fails as
// if offline.
import * as fs from "fs";
import * as path from "path";
import { Fetch } from "../../src/core/http";

const repoRoot = path.join(__dirname, "../..");

function listFiles(dir: string): string[] {
  return fs
    .readdirSync(path.join(repoRoot, dir), { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? listFiles(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
    );
}

export function makeFakeGithub() {
  const requests: string[] = [];
  let offline = false;
  const respond = (body: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Not Found",
    json: async () => body,
    text: async () => JSON.stringify(body),
    arrayBuffer: async () => new ArrayBuffer(0),
  });
  const fetch: Fetch = async (url) => {
    requests.push(url);
    if (offline) {
      throw new TypeError("fetch failed: getaddrinfo ENOTFOUND github.com");
    }
    const tree = url.match(/\/git\/trees\/([^?]+)\?recursive=1$/);
    if (tree) {
      return respond({
        tree: listFiles("files").map((p) => ({ path: p, type: "blob" })),
      });
    }
    const raw = url.match(
      /^https:\/\/raw\.githubusercontent\.com\/SteamGridDB\/steam-rom-manager\/[^/]+\/(.+)$/,
    );
    if (raw) {
      const file = path.join(repoRoot, decodeURI(raw[1]));
      return fs.existsSync(file)
        ? respond(JSON.parse(fs.readFileSync(file, "utf8")))
        : respond(null, 404);
    }
    return respond(null, 404);
  };
  return {
    fetch,
    requests,
    setOffline: (value: boolean) => {
      offline = value;
    },
  };
}
