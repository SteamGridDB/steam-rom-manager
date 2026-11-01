import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { CoreClientService } from "./core-client.service";
import type {
  LibraryShortcuts,
  ShortcutDetails,
} from "../../core/library-reader";

// "View Games": Steam's current shortcuts, read by the LibraryReader in the
// main process.
@Injectable()
export class ViewService {
  shortcuts: LibraryShortcuts;
  status: { [k: string]: BehaviorSubject<boolean> } = {
    refreshingShortcuts: new BehaviorSubject(false),
    refreshingDetails: new BehaviorSubject(false),
  };
  constructor(private coreClient: CoreClientService) {}

  async refreshGames() {
    this.shortcuts = null;
    this.status.refreshingShortcuts.next(true);
    this.status.refreshingDetails.next(true);
    try {
      this.shortcuts = await this.coreClient.client.call("library", "read");
    } finally {
      this.status.refreshingShortcuts.next(false);
      this.status.refreshingDetails.next(false);
    }
  }

  details(
    steamDir: string,
    userId: string,
    appid: number,
  ): Promise<ShortcutDetails> {
    return this.coreClient.client.call(
      "library",
      "details",
      steamDir,
      userId,
      appid,
    );
  }

  launch(steamDir: string, userId: string, appid: number): Promise<void> {
    return this.coreClient.client.call(
      "library",
      "launch",
      steamDir,
      userId,
      appid,
    );
  }
}
