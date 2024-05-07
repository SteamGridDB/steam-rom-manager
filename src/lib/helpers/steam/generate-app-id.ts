import * as crc from 'crc';
function generatePreliminaryId(exe: string, appname: string) {
  const key = exe + appname;
  const top = BigInt(crc.crc32(key)) | BigInt(0x80000000);
  return BigInt(top) << BigInt(32) | BigInt(0x02000000);

}

// Used for Big Picture Grids (also as key in SRM data structures)
export function generateAppId(exe: string, appname: string) {
  return String(generatePreliminaryId(exe, appname));
}

// Used for all other Grids
export function generateShortAppId(exe: string, appname: string) {
  return shortenAppId(generateAppId(exe, appname));
}
// Convert from AppId to ShortAppId
export function shortenAppId(longId: string) {
  return String(BigInt(longId) >> BigInt(32));
}

// Convert from ShortAppId to AppId
export function lengthenAppId(shortId: string) {
  return String(BigInt(shortId) << BigInt(32) | BigInt(0x02000000));
}

// Used as appid in shortcuts.vdf
export function generateShortcutId(exe: string, appname: string) {
  return Number((generatePreliminaryId(exe, appname) >> BigInt(32)) - BigInt(0x100000000));
}

// Convert from AppId to ShortcutAppId
export function shortcutifyAppId(longId: string) {
  return Number(shortenAppId(longId)) >> 32
}

// Convert from ShortcutAppId to AppId
export function appifyShortcutId(shortcutId: number) {
  return lengthenAppId(String(BigInt(shortcutId) + BigInt(0x100000000)))
}
