import { LbmCycle } from "./types";

export type PaletteInfo = {
  id: number;
  name: string;
  colors: number[][];
  cycles: LbmCycle[];
  startSeconds: number;
  endSeconds: number;
};

export type OverlayInfo = {
  id: number;
  name: string;
  width: number;
  height: number;
  pixels: number[];
};

export type WorldData = {
  name: string;
  width: number;
  height: number;
  paletteInfos: PaletteInfo[];
  pixels: number[];
  overlays: OverlayInfo[];
};

// ----------
export function getEmptyWorldData(): WorldData {
  return {
    name: "",
    width: 0,
    height: 0,
    paletteInfos: [],
    pixels: [],
    overlays: [],
  };
}
