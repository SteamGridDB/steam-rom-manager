// UserExceptionsService (renderer) over IPC to the ExceptionsStore in main.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as paths from "../../src/paths";
import { Core } from "../../src/core/core";
import { hostCore } from "../../src/core/rpc-host";
import { CoreClient } from "../../src/renderer/core-client";
import { UserExceptionsService } from "../../src/renderer/services/user-exceptions.service";
import { makeLogger, settleCoresAfterEach } from "../helpers/services-harness";
import { makeRpcPair } from "../helpers/rpc-pair";
import { makeFakeNetwork } from "../helpers/fake-network";

const changes = (extra: object = {}) => ({
  newTitle: "",
  searchTitle: "",
  sgdbId: "",
  commandLineArguments: "",
  excludeArtwork: false,
  ...extra,
});

describe("exceptions over IPC", () => {
  beforeEach(() => fs.rmSync(paths.userExceptions, { force: true }));

  const settled = settleCoresAfterEach(afterEach);

  async function makeService() {
    const core = new Core({
      logger: makeLogger().service,
      fetch: makeFakeNetwork(),
    });
    settled(core).start({ presets: false });
    const { host, client } = makeRpcPair();
    hostCore(core, host);
    const service = new UserExceptionsService({
      client: new CoreClient(client),
    } as any);
    await core.ready.exceptions;
    await new Promise((r) => setTimeout(r, 10));
    return service;
  }

  it("a game's exception is saved in main and visible immediately", async () => {
    const service = await makeService();
    const id = service.makeExceptionId('"/emu/a"', "Game A", "Glob");
    service.setGameException(id, "Game A", changes({ newTitle: "Renamed" }));
    expect(service.exceptionFor(id, "Game A").newTitle).toBe("Renamed");
    expect(
      JSON.parse(fs.readFileSync(paths.userExceptions, "utf8")).exceptions,
    ).toEqual([
      expect.objectContaining({ matchAppId: id, newTitle: "Renamed" }),
    ]);
    service.deleteGameException(id);
    expect(service.exceptionFor(id, "Game A")).toBeUndefined();
  });

  it("exclusions: add from Add Games, put back", async () => {
    const service = await makeService();
    service.exclude([{ appId: "1", appTitle: "Game" }]);
    expect(service.data.exclusions).toEqual([
      expect.objectContaining({ matchAppId: "1", appTitle: "Game" }),
    ]);
    service.removeExclusions([service.data.exclusions[0].id]);
    expect(service.data.exclusions).toEqual([]);
  });

  it("the exceptions page's rules: validated, then saved", async () => {
    const service = await makeService();
    const data = {
      exceptions: [
        {
          id: "a",
          matchTitle: "X",
          timeStamp: 1,
          ...changes({ newTitle: "Y" }),
        },
      ],
      exclusions: [{ id: "b", matchTitle: "Z", timeStamp: 1 }],
    };
    expect(service.validate(data)).toBeNull();
    expect(service.save(data)).toBe(true);
    expect(service.exceptionFor("?", "X").newTitle).toBe("Y");
    expect(
      service.validate({
        ...data,
        exclusions: [
          ...data.exclusions,
          { id: "c", matchTitle: "Z", timeStamp: 2 },
        ],
      }),
    ).toMatch(/title:Z/);
  });
});
