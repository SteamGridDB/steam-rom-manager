import * as long from 'long';

export function steamID_64_ToAccountID(steamID64: string) {
    let steamID_64_Identifier = long.fromString("0110000100000000", true, 16);
    let longValue = long.fromValue(steamID64).subtract(steamID_64_Identifier);
    return longValue.toString();
}
