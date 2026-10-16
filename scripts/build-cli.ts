// Builds the standalone command line into one executable per architecture
// for this OS, with Node's single executable applications: the CLI bundle
// (dist-cli/srm.js, from `yarn build:cli-bundle`) injected into a Node
// binary. No Electron, no install, no native modules.
//
//   ts-node scripts/build-cli.ts [--arch x64,arm64]
//
// Writes release/cli/: srm-cli-<version>-<os>-<arch>.exe on Windows, and
// .tar.gz archives (holding `srm`, executable) on Linux and macOS.
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const { inject } = require("postject");

const root = path.join(__dirname, "..");
const version: string = require("../package.json").version;
// The executables get the Node this runs on: the injected blob has to match.
const nodeVersion = process.version;
const fuse = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";

const osName = { win32: "win", linux: "linux", darwin: "mac" }[
  process.platform as "win32" | "linux" | "darwin"
];
if (!osName) throw new Error(`Unsupported platform ${process.platform}`);
const archArg = process.argv.indexOf("--arch");
const archs =
  archArg > 0 ? process.argv[archArg + 1].split(",") : ["x64", "arm64"];

const outDir = path.join(root, "release", "cli");
const work = path.join(outDir, "work");
const bundle = path.join(root, "dist-cli", "srm.js");

const run = (file: string, args: string[], cwd = root) =>
  execFileSync(file, args, { cwd, stdio: "inherit" });

// The Node binary for an architecture: this one, or the same version from
// nodejs.org.
async function nodeBinary(arch: string): Promise<string> {
  if (arch === process.arch) return process.execPath;
  const plat = { win: "win", linux: "linux", mac: "darwin" }[osName];
  const ext =
    osName === "win" ? "zip" : osName === "linux" ? "tar.xz" : "tar.gz";
  const name = `node-${nodeVersion}-${plat}-${arch}`;
  const archive = path.join(work, `${name}.${ext}`);
  if (!fs.existsSync(archive)) {
    const url = `https://nodejs.org/dist/${nodeVersion}/${name}.${ext}`;
    console.log(`Downloading ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    fs.writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
  }
  // Windows' own tar (bsdtar) reads zip; Git's GNU tar, often first on the
  // PATH, doesn't.
  const tar =
    osName === "win"
      ? path.join(
          process.env.SystemRoot ?? "C:\\Windows",
          "System32",
          "tar.exe",
        )
      : "tar";
  run(tar, ["-xf", path.basename(archive)], work);
  return osName === "win"
    ? path.join(work, name, "node.exe")
    : path.join(work, name, "bin", "node");
}

async function main() {
  if (!fs.existsSync(bundle)) {
    throw new Error(`${bundle} is missing: run yarn build:cli-bundle first`);
  }
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });

  // The app, prepared for injection. No snapshot or code cache: those are
  // tied to the architecture that builds them.
  const blob = path.join(work, "sea-prep.blob");
  const config = path.join(work, "sea-config.json");
  fs.writeFileSync(
    config,
    JSON.stringify({
      main: bundle,
      output: blob,
      disableExperimentalSEAWarning: true,
      useSnapshot: false,
      useCodeCache: false,
    }),
  );
  run(process.execPath, ["--experimental-sea-config", config]);

  for (const arch of archs) {
    const exe = osName === "win" ? "srm.exe" : "srm";
    const dir = path.join(work, `${osName}-${arch}`);
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, exe);
    fs.copyFileSync(await nodeBinary(arch), target);
    fs.chmodSync(target, 0o755);
    if (osName === "mac") run("codesign", ["--remove-signature", target]);
    await inject(target, "NODE_SEA_BLOB", fs.readFileSync(blob), {
      sentinelFuse: fuse,
      machoSegmentName: osName === "mac" ? "NODE_SEA" : undefined,
    });
    // macOS only runs signed code (ad hoc is enough)
    if (osName === "mac") run("codesign", ["--sign", "-", target]);

    // It runs (when this machine can run it).
    if (arch === process.arch) {
      const printed = execFileSync(target, ["--version"]).toString().trim();
      if (printed !== version) {
        throw new Error(`${target} --version printed "${printed}"`);
      }
    }

    const name = `srm-cli-${version}-${osName}-${arch}`;
    if (osName === "win") {
      fs.copyFileSync(target, path.join(outDir, `${name}.exe`));
    } else {
      // (an archive keeps the executable bit)
      run("tar", ["-czf", path.join(outDir, `${name}.tar.gz`), exe], dir);
    }
    console.log(`Built ${name}`);
  }
  fs.rmSync(work, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
