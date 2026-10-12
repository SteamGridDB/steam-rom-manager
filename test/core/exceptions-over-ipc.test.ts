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

const exception = (extra: object = {}) => ({
  newTitle: "",
  searchTitle: "",
  timeStamp: 1,
  commandLineArguments: "",
  exclude: false,
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

  it("edits by id are saved in main and visible immediately", async () => {
    const service = await makeService();
    const id = service.makeExceptionId('"/emu/a"', "Game A", "Glob");
    service.addExceptionById(id, "Game A", exception({ newTitle: "Renamed" }));
    expect(service.getExceptionById(id).newTitle).toBe("Renamed");
    expect(
      JSON.parse(fs.readFileSync(paths.userExceptions, "utf8")).titles,
    ).toHaveProperty([`Game A \${id:${id}}`]);
    service.deleteExceptionById(id);
    expect(service.getExceptionById(id)).toBeUndefined();
  });

  it("the editor's unsaved copy is saved on request", async () => {
    const service = await makeService();
    service.setIsUnsaved(true);
    expect(service.setCurrent({ titles: { X: exception() } })).toBeNull();
    service.saveUserExceptions();
    expect(service.isUnsaved).toBe(false);
    expect(service.data.saved.titles).toHaveProperty("X");
    expect(service.data.current).toBeNull();
  });
});
