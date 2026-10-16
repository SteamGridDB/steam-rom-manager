// The command line without the app: plain Node, no Electron or Chromium.
// Built by `yarn build:cli` into one executable per platform (see
// scripts/build-cli.ts). Same commands, data and behavior as `srm <command>`
// through the app.
import * as tls from "tls";
import { parseCliArgs } from "./cli-args";
import { runCli } from "./cli";

// node:sqlite (used for some parsers' databases) announces itself as
// experimental on stderr; that's not the user's business.
process.removeAllListeners("warning");

// Trust the system's certificates too (corporate proxies, custom CAs), as
// the app does through Electron's network stack.
const certs = tls as typeof tls & {
  getCACertificates?: (type: string) => string[];
  setDefaultCACertificates?: (certs: string[]) => void;
};
try {
  certs.setDefaultCACertificates?.([
    ...certs.getCACertificates("default"),
    ...certs.getCACertificates("system"),
  ]);
} catch {
  // older Node: bundled certificates only
}

async function main() {
  const args = process.argv.slice(2);
  // No command: what there is to do (the app would open its window).
  const request = parseCliArgs(args.length ? args : ["--help"]);
  if (!request) {
    return 0;
  }
  try {
    return await runCli(request);
  } catch (error) {
    process.stderr.write(`${(error as Error)?.stack ?? error}\n`);
    return 1;
  }
}

main().then((code) => process.exit(code));
