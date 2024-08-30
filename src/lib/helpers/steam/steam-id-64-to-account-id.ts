import Long from "long";

export function steamID_64_ToAccountID(steamID64: string) {
  let steamID_64_Identifier = Long.fromString("0110000100000000", true, 16);
  return Long.fromValue(steamID64).subtract(steamID_64_Identifier).toString();
}
