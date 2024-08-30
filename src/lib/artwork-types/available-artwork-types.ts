import { ArtworkType, ArtworkViewType } from "../../models";

export const artworkTypes = ["tall", "long", "hero", "logo", "icon"] as const;

export const viewTypes = ["games", "list"] as const;

export const defaultArtworkType: ArtworkType = "tall";

export const artworkViewTypes: ArtworkViewType[] = [
  ...artworkTypes,
  ...viewTypes,
];

export const artworkDimsDict: Record<
  ArtworkType,
  { width: string; height: string }
> = {
  tall: { width: "600px", height: "900px" },
  long: { width: "1196px", height: "559px" }, // 920x430 x 1.3
  hero: { width: "1920px", height: "620px" },
  logo: { width: "960px", height: "540px" },
  icon: { width: "600px", height: "600px" },
};

export const artworkViewNames: Record<ArtworkViewType, string> = {
  tall: "Portraits",
  long: "Banners",
  hero: "Heroes",
  logo: "Logos",
  icon: "Icons",
  games: "All Artwork",
  list: "List View",
};

export const artworkSingDict: Record<ArtworkType, string> = {
  tall: "portrait",
  long: "banner",
  hero: "hero",
  logo: "logo",
  icon: "icon",
};

export const steamArtworkDict: Record<ArtworkType, string | undefined> = {
  tall: "library_600x900.jpg",
  long: "header.jpg",
  hero: "library_hero.jpg",
  logo: "logo.png",
  icon: undefined,
};

export const artworkIdDict: Record<ArtworkType, string> = {
  tall: "p",
  long: "",
  hero: "_hero",
  logo: "_logo",
  icon: "_icon",
};

export const invertedArtworkIdDict: { [k: string]: ArtworkType } = {
  ["p"]: "tall",
  [""]: "long",
  ["_hero"]: "hero",
  ["_logo"]: "logo",
  ["_icon"]: "icon",
};
