import { Injectable } from "@angular/core";
import { DatePipe } from "@angular/common";
import { BehaviorSubject } from "rxjs";
import {
  AlertMessage,
  LogMessage,
  MessageSettings,
  LogSettings,
} from "../../models";
import { xRequest } from "../../lib/x-request";
import * as paths from "../../paths";
import * as fs from "fs-extra";
import * as path from "path";
@Injectable()
export class LoggerService {
  private static xRequest = new xRequest();
  private alertMessage: BehaviorSubject<AlertMessage> =
    new BehaviorSubject<AlertMessage>(undefined);
  private logMessages: BehaviorSubject<LogMessage[]> = new BehaviorSubject<
    LogMessage[]
  >([]);
  private hideAfterNavigationChange: boolean = false;
  private logSettings: LogSettings;

  constructor(public datePipe: DatePipe) {
    this.logSettings = {
      showErrors: true,
      showInfo: true,
      showSuccesses: true,
      showFuzzy: false,
      autoscroll: false,
      textWrap: false,
      currentScrollValue: 0,
    };
  }

  success(message: string, settings?: MessageSettings) {
    this.postMessage("success", message, settings);
  }

  info(message: string, settings?: MessageSettings) {
    this.postMessage("info", message, settings);
  }

  error(message: string | Error, settings?: MessageSettings) {
    this.postMessage("error", message, settings);
  }

  fuzzy(message: string, settings?: MessageSettings) {
    this.postMessage("fuzzy", message, settings);
  }

  private postMessage(
    type: "success" | "info" | "error" | "fuzzy",
    message: any,
    settings?: MessageSettings,
  ) {
    let keepAfterNavigationChange: boolean = false;
    let invokeAlert: boolean = false;
    let doNotAppendToLog: boolean = false;
    let alertTimeout: number = 0;

    if (settings) {
      invokeAlert =
        settings.invokeAlert !== undefined ? settings.invokeAlert : false;
      doNotAppendToLog =
        settings.doNotAppendToLog !== undefined
          ? settings.doNotAppendToLog
          : false;
      alertTimeout =
        settings.alertTimeout !== undefined ? settings.alertTimeout : 0;
    }

    if (invokeAlert) {
      this.alertMessage.next({
        type: type,
        text: message,
        timeout: alertTimeout,
      });
    }

    if (!doNotAppendToLog) {
      let logMessages = this.logMessages.getValue();
      logMessages = logMessages.concat({
        type: type,
        text: message,
      });
      this.logMessages.next(logMessages);
    }
  }

  clearLog() {
    this.logMessages.next([]);
  }

  submitReport(
    description: string,
    useVDFs: boolean,
    discordUser?: string,
    steamDirectory?: string,
  ) {
    return new Promise<{ key: string; deleteKey: string }>(
      (resolve, reject) => {
        let body = new FormData();
        body.append(
          "description",
          new Blob([
            `Description: ${description}\n\n Discord User: ${discordUser}`,
          ]),
          "description.txt",
        );
        let logMessages = this.logMessages
          .getValue()
          .map((item: any) => `[${item.type}] ${item.text}`);
        body.append(
          "logMessages",
          new Blob([logMessages.join("\n")]),
          "log.txt",
        );
        if (fs.existsSync(paths.userSettings)) {
          let userSettings = new Blob([fs.readFileSync(paths.userSettings)]);
          body.append("files[]", userSettings, "userSettings.json");
        }
        if (fs.existsSync(paths.userConfigurations)) {
          let userConfigurations = new Blob([
            fs.readFileSync(paths.userConfigurations),
          ]);
          body.append("files[]", userConfigurations, "userConfigurations.json");
        }
        if (fs.existsSync(paths.userExceptions)) {
          let userExceptions = new Blob([
            fs.readFileSync(paths.userExceptions),
          ]);
          body.append("files[]", userExceptions, "userExceptions.json");
        }
        if (useVDFs) {
          let userData = path.join(steamDirectory, "userdata");
          let dirx = new RegExp("^[0-9]*$");
          let userDirs = fs
            .readdirSync(userData, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory() && dirx.test(dirent.name))
            .map((dirent) => dirent.name);
          for (let userDir of userDirs) {
            let shortcutsVDFPath = path.join(
              steamDirectory,
              "userdata",
              userDir,
              "config",
              "shortcuts.vdf",
            );
            if (fs.existsSync(shortcutsVDFPath)) {
              let shortcutsVDF = new Blob([fs.readFileSync(shortcutsVDFPath)]);
              body.append("files[]", shortcutsVDF, `shortcuts_${userDir}.vdf`);
            }
            let screenshotsVDFPath = path.join(
              steamDirectory,
              "userdata",
              userDir,
              "760",
              "screenshots.vdf",
            );
            if (fs.existsSync(screenshotsVDFPath)) {
              let screenshotsVDF = new Blob([
                fs.readFileSync(screenshotsVDFPath),
              ]);
              body.append(
                "files[]",
                screenshotsVDF,
                `screenshots_${userDir}.vdf`,
              );
            }
          }
        }
        return LoggerService.xRequest
          .request("https://logs.jozen.blue/logs", {
            responseType: "json",
            method: "POST",
            body: body,
            timeout: 10000,
          })
          .then((data: any) => {
            if (data && data.key && data.delete_key) {
              resolve({ key: data.key, deleteKey: data.delete_key });
            } else {
              reject(`Bug report server returned no data.`);
            }
          })
          .catch((err) => {
            reject(`Bug report server error: ${JSON.stringify(err)}`);
          });
      },
    );
  }

  getAlertMessage() {
    return this.alertMessage.asObservable();
  }

  getLogMessages() {
    return this.logMessages.asObservable();
  }

  getLogSettings() {
    return this.logSettings;
  }
}
