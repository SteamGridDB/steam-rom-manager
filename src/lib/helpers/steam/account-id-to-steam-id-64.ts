import Long from "long";

// Inverse of steamID_64_ToAccountID: turns a userdata account id (the folder
// name under steam/userdata) into a 64-bit steamID, as required by the Steam
// Web API (e.g. IPlayerService/GetOwnedGames).
export function accountID_ToSteamID64(accountID: string) {
  let steamID_64_Identifier = Long.fromString("0110000100000000", true, 16);
  return Long.fromValue(accountID).add(steamID_64_Identifier).toString();
}
