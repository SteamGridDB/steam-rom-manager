import { SteamInputEnabled } from "../models";

// Controller types SRM can apply templates for (no file access here, so the
// UI can use these too).
export const controllerTypes = [
  "gamecube",
  "wii",
  "ps3",
  "ps4",
  "ps5",
  "ps5_edge",
  "xbox360",
  "xboxone",
  "xboxelite",
  "switch_joycon_left",
  "switch_joycon_right",
  "switch_joycon_pair",
  "switch_pro",
  "switch2_pro",
  "neptune",
  "triton",
  "steamcontroller_gordon",
  "generic",
  "8bitdo",
  "rog_ally",
  "legion_go_s",
];
export const controllerNames = {
  gamecube: "Gamecube Controller",
  wii: "Wii Remote",
  ps3: "PS3 Controller",
  ps4: "PS4 Controller",
  ps5: "PS5 Controller",
  ps5_edge: "PS5 Dualsense Edge Controller",
  xbox360: "Xbox 360 Controller",
  xboxone: "Xbox One Controller",
  xboxelite: "Xbox One Elite Controller",
  switch_joycon_left: "Switch Joy-Con (Left)",
  switch_joycon_right: "Switch Joy-Con (Right)",
  switch_joycon_pair: "Switch Joy-Con (Pair)",
  switch_pro: "Switch Pro Controller",
  switch2_pro: "Switch 2 Pro Controller",
  neptune: "Steam Deck",
  triton: "Steam Controller (Triton 2026)",
  steamcontroller_gordon: "Steam Controller (Gordon 2015)",
  generic: "Generic Controller",
  "8bitdo": "8bitdo Controller",
  rog_ally: "ASUS ROG Ally",
  legion_go_s: "Lenovo Legion Go S",
};

export const enableDisplayNames: Record<SteamInputEnabled, string> = {
  ["0"]: "Disabled",
  ["1"]: "Use default settings",
  ["2"]: "Enabled",
};
