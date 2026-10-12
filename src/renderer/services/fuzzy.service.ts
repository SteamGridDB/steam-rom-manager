import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { CoreClientService } from "./core-client.service";

// The fuzzy matcher's title list lives in the main process (FuzzyStore);
// this exposes what the UI shows and the maintenance actions.
@Injectable()
export class FuzzyService {
  private list = new BehaviorSubject<{ totalGames: number; games: string[] }>({
    totalGames: 0,
    games: [],
  });

  constructor(private coreClient: CoreClientService) {
    const client = this.coreClient.client;
    client.on("fuzzy:list", ({ totalGames }) =>
      this.list.next({ totalGames, games: [] }),
    );
    client.whenLoaded("fuzzy").then(() => {
      const { totalGames } = client.callSync("fuzzy", "getListInfo");
      this.list.next({ totalGames, games: [] });
    });
  }

  // The parts of FuzzyListLoader the UI uses. (Only the list size is
  // mirrored; the titles themselves stay in the main process.)
  get fuzzyLoader() {
    const client = this.coreClient.client;
    return {
      observeList: () => this.list.asObservable(),
      resetList: (): Promise<void> => client.call("fuzzy", "resetList"),
      resetCache: (): Promise<void> => client.call("fuzzy", "resetCache"),
    };
  }

  saveCacheIfNeeded(): Promise<void> {
    return this.coreClient.client.call("fuzzy", "saveCacheIfNeeded");
  }
}
