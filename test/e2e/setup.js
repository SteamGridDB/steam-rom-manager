// Builds an isolated SRM environment: copied userData (only Snes9x enabled),
// fake Steam install with user content, fake ROMs and RetroArch.
const fs = require("fs"),
  path = require("path");
const [realUserData, root, parserPrefix = "Snes9x"] = process.argv.slice(2);
fs.rmSync(root, { recursive: true, force: true });
const p = (...x) => path.join(root, ...x);
const write = (f, s) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, s);
};

// Fake Steam (account 11111111 = "alice")
write(
  p("steam", "config", "loginusers.vdf"),
  '"users"\n{\n\t"76561197971376839"\n\t{\n\t\t"AccountName"\t\t"alice"\n\t\t"PersonaName"\t\t"alice"\n\t}\n}\n',
);
write(
  p("steam", "config", "config.vdf"),
  '"InstallConfigStore"\n{\n\t"Software"\n\t{\n\t\t"Valve"\n\t\t{\n\t\t\t"Steam"\n\t\t\t{\n\t\t\t\t"CompatToolMapping"\n\t\t\t\t{\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n}\n',
);
const cfg = p("steam", "userdata", "11111111", "config");
write(
  path.join(cfg, "localconfig.vdf"),
  '"UserLocalConfigStore"\n{\n\t"apps"\n\t{\n\t}\n}\n',
);
write(
  path.join(cfg, "cloudstorage", "cloud-storage-namespaces.json"),
  JSON.stringify([[1, "1"]]),
);
write(
  path.join(cfg, "cloudstorage", "cloud-storage-namespace-1.json"),
  JSON.stringify([
    [
      "user-collections.uc-mine",
      {
        key: "user-collections.uc-mine",
        timestamp: 1,
        value: JSON.stringify({
          id: "uc-mine",
          name: "My Collection",
          added: [440],
          removed: [],
        }),
        version: "1",
      },
    ],
  ]),
);

// ROMs and a fake RetroArch
for (const rom of ["Super Mario World (USA).sfc", "Chrono Trigger (USA).sfc"])
  write(p("roms", "Snes9x", "Games", rom), "");
write(p("retroarch", "retroarch.exe"), "");

// userData copy
const ud = p("userData");
fs.mkdirSync(ud, { recursive: true });
for (const f of fs.readdirSync(realUserData))
  if (f.endsWith(".json"))
    fs.copyFileSync(path.join(realUserData, f), path.join(ud, f));
const configs = JSON.parse(
  fs.readFileSync(path.join(ud, "userConfigurations.json"), "utf8"),
);
for (const c of configs) {
  c.disabled = !c.configTitle.startsWith(parserPrefix);
  // Disabled parsers count too (e.g. "remove all", View Games): never let
  // one point at the real Steam install.
  if (c.steamDirectory !== "${steamdirglobal}") c.steamDirectory = p("steam");
}
fs.writeFileSync(
  path.join(ud, "userConfigurations.json"),
  JSON.stringify(configs, null, 4),
);
const settings = JSON.parse(
  fs.readFileSync(path.join(ud, "userSettings.json"), "utf8"),
);
Object.assign(settings.environmentVariables, {
  steamDirectory: p("steam"),
  romsDirectory: p("roms"),
  retroarchPath: p("retroarch", "retroarch.exe"),
  raCoresDirectory: p("retroarch", "cores"),
  userAccounts: ["alice"],
});
settings.autoKillSteam = false;
settings.autoRestartSteam = false;
fs.writeFileSync(
  path.join(ud, "userSettings.json"),
  JSON.stringify(settings, null, 2),
);
console.log(
  "enabled:",
  configs.filter((c) => !c.disabled).map((c) => c.configTitle),
);
