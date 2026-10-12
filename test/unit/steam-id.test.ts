import { describe, expect, it } from "vitest";
import { accountID_ToSteamID64 } from "../../src/lib/helpers/steam/account-id-to-steam-id-64";
import { steamID_64_ToAccountID } from "../../src/lib/helpers/steam/steam-id-64-to-account-id";

describe("steam id conversions", () => {
  it("adds/subtracts the individual-account base 76561197960265728", () => {
    expect(accountID_ToSteamID64("1")).toBe("76561197960265729");
    expect(steamID_64_ToAccountID("76561197960265729")).toBe("1");
  });

  it("round-trips", () => {
    for (const id of ["0", "84977612", "4294967295"]) {
      expect(steamID_64_ToAccountID(accountID_ToSteamID64(id))).toBe(id);
    }
  });
});
