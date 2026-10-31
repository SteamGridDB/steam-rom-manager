import * as fs from "fs-extra";
import * as path from "path";
import * as paths from "../paths";
import { Fetch } from "./http";

export interface BugReport {
  description: string;
  discordUser?: string;
  logText: string;
  // Also attach every user's shortcuts.vdf and screenshots.vdf from here.
  vdfsFrom?: string;
}

export interface BugReportResult {
  ok: boolean;
  // On success: the report's id and the key that deletes it.
  key?: string;
  deleteKey?: string;
  error?: string;
  // The report itself is incomplete (nothing was sent).
  invalid?: boolean;
}

const reportUrl = "https://logs.jozen.blue/logs";

async function attach(body: FormData, file: string, name: string) {
  if (await fs.pathExists(file)) {
    body.append("files[]", new Blob([await fs.readFile(file)]), name);
  }
}

// Uploads a bug report with the user's SRM data files (and optionally Steam's
// shortcut files) to SRM's log server.
export async function submitBugReport(
  fetch: Fetch,
  report: BugReport,
): Promise<BugReportResult> {
  const { vdfsFrom } = report;
  if (vdfsFrom !== undefined && !(vdfsFrom && fs.existsSync(vdfsFrom))) {
    return {
      ok: false,
      invalid: true,
      error: "Valid steam directory is required to upload VDFs",
    };
  }
  const body = new FormData();
  body.append(
    "description",
    new Blob([
      `Description: ${report.description}\n\n Discord User: ${report.discordUser}`,
    ]),
    "description.txt",
  );
  body.append("logMessages", new Blob([report.logText]), "log.txt");
  await attach(body, paths.userSettings, "userSettings.json");
  await attach(body, paths.userConfigurations, "userConfigurations.json");
  await attach(body, paths.userExceptions, "userExceptions.json");
  if (vdfsFrom) {
    const userDirs = (
      await fs.readdir(path.join(vdfsFrom, "userdata"), {
        withFileTypes: true,
      })
    )
      .filter((dirent) => dirent.isDirectory() && /^[0-9]*$/.test(dirent.name))
      .map((dirent) => dirent.name);
    for (const userDir of userDirs) {
      const userPath = path.join(vdfsFrom, "userdata", userDir);
      await attach(
        body,
        path.join(userPath, "config", "shortcuts.vdf"),
        `shortcuts_${userDir}.vdf`,
      );
      await attach(
        body,
        path.join(userPath, "760", "screenshots.vdf"),
        `screenshots_${userDir}.vdf`,
      );
    }
  }
  let data: any;
  try {
    const res = await fetch(reportUrl, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    data = await res.json();
  } catch (e) {
    return { ok: false, error: `Bug report server error: ${e?.message ?? e}` };
  }
  if (data && data.key && data.delete_key) {
    return { ok: true, key: data.key, deleteKey: data.delete_key };
  }
  return { ok: false, error: "Bug report server returned no data." };
}
