import * as path from "path";
import { glob } from "glob";
import { exec } from "child_process";
import {
  ControllerTemplate,
  Logger,
  SteamInputEnabled,
  VDF_ShortcutsItem,
} from "../models";
import { VDF_Manager } from "../lib/vdf-manager";
import { ControllerManager } from "../lib/controller-manager";
import { controllerTypes } from "../lib/controller-types";
import { artworkTypes, artworkIdDict } from "../lib/artwork-types";
import { generateShortAppId } from "../lib/helpers/steam/generate-app-id";
import { encodeFile } from "../lib/helpers/url/file-url";
import { ParsersStore } from "./parsers-store";

// Shortcuts per Steam directory and user, as shown by "View Games".
export type LibraryShortcuts = {
  [steamDir: string]: { [userId: string]: VDF_ShortcutsItem[] };
};

export interface ShortcutDetails {
  // file:// URL of each artwork type found in the grid folder, or null.
  artwork: { [artworkType: string]: string | null };
  controllers: {
    [controllerType: string]: { title: string; templatePath: string };
  };
  steamInputEnabled: SteamInputEnabled;
}

interface UserData {
  gridDir: string;
  shortcuts: VDF_ShortcutsItem[];
  configsets: { [controllerType: string]: any };
  localConfig: any;
}

// Reads what SRM (and others) have put into Steam: non-Steam shortcuts,
// their artwork and controller settings. Read-only, except for launching.
export class LibraryReader {
  private users: { [steamDir: string]: { [userId: string]: UserData } } = {};
  private templates: {
    [steamDir: string]: { [controllerType: string]: ControllerTemplate[] };
  } = {};

  constructor(
    private logger: Logger,
    private parsers: ParsersStore,
  ) {}

  async read(): Promise<LibraryShortcuts> {
    this.users = {};
    this.templates = {};
    const vdfManager = new VDF_Manager();
    await vdfManager.prepare(this.parsers.getKnownSteamDirectories());
    await vdfManager.read({ addedItems: false });
    const controllerManager = new ControllerManager();
    const result: LibraryShortcuts = {};
    for (const [steamDir, users] of Object.entries(vdfManager.vdfData)) {
      result[steamDir] = {};
      this.users[steamDir] = {};
      for (const [userId, vdfs] of Object.entries(users)) {
        const shortcuts: VDF_ShortcutsItem[] = vdfs.shortcuts.data || [];
        result[steamDir][userId] = shortcuts;
        let configsets = {};
        let localConfig = {};
        try {
          configsets = controllerManager.readControllers(
            ControllerManager.configsetDir(steamDir, userId),
          );
          localConfig = controllerManager.readLocalConfig(
            ControllerManager.localConfigPath(steamDir, userId),
          );
        } catch (e) {
          this.logger.error(e);
        }
        this.users[steamDir][userId] = {
          gridDir: vdfs.screenshots.gridDir,
          shortcuts,
          configsets,
          localConfig,
        };
      }
      this.templates[steamDir] = {};
      for (const controllerType of controllerTypes) {
        this.templates[steamDir][controllerType] =
          await ControllerManager.readTemplates(steamDir, controllerType);
      }
    }
    return result;
  }

  private shortcut(steamDir: string, userId: string, appid: number) {
    const user = this.users[steamDir]?.[userId];
    const shortcut = user?.shortcuts.find((s) => s.appid === appid);
    if (!shortcut) {
      throw new Error(`Unknown shortcut ${appid}; refresh the list.`);
    }
    return { user, shortcut };
  }

  async details(
    steamDir: string,
    userId: string,
    appid: number,
  ): Promise<ShortcutDetails> {
    const { user, shortcut } = this.shortcut(steamDir, userId, appid);
    const shortAppId = generateShortAppId(shortcut.exe, shortcut.appname);
    const artwork: ShortcutDetails["artwork"] = {};
    for (const artworkType of artworkTypes) {
      const files = await glob(`${shortAppId}${artworkIdDict[artworkType]}.*`, {
        dot: true,
        cwd: user.gridDir,
        absolute: true,
      });
      artwork[artworkType] = files.length ? encodeFile(files[0]) : null;
    }
    const controllers: ShortcutDetails["controllers"] = {};
    for (const controllerType of controllerTypes) {
      const configset = user.configsets[controllerType];
      const appController =
        configset?.controller_config[
          ControllerManager.transformTitle(shortcut.appname)
        ];
      if (!appController || !(appController.template || appController.workshop))
        continue;
      const mappingId = appController.template || appController.workshop;
      const template = (this.templates[steamDir][controllerType] || []).find(
        (x) => x.mappingId == mappingId,
      );
      if (template?.title) {
        controllers[controllerType] = {
          title: template.title,
          templatePath: path.join(
            appController.template
              ? ControllerManager.templatesValveDir(steamDir)
              : ControllerManager.templatesUserDir(steamDir),
            mappingId,
          ),
        };
      }
    }
    // shortcuts.vdf holds the id signed; SRM keys localconfig by the
    // unsigned short id (older SRM: the signed one).
    const localApps = user.localConfig?.UserLocalConfigStore?.apps;
    const steamInputEnabled: SteamInputEnabled =
      (
        localApps?.[String(shortcut.appid >>> 0)] ||
        localApps?.[shortcut.appid] ||
        {}
      ).UseSteamControllerConfig || "1";
    return { artwork, controllers, steamInputEnabled };
  }

  // Runs the shortcut's command line (as the Steam shortcut would).
  launch(steamDir: string, userId: string, appid: number) {
    const { shortcut } = this.shortcut(steamDir, userId, appid);
    const command = shortcut.LaunchOptions
      ? `${shortcut.exe} ${shortcut.LaunchOptions}`
      : shortcut.exe;
    exec(command, { cwd: shortcut.StartDir });
  }
}
