export type ObjectWithId = {
  id: number;
};

export type LbmCycle = {
  low: number;
  high: number;
  rate: number;
  reverse: number;
};

export type LbmData = {
  name: string;
  width: number;
  height: number;
  colors: number[][];
  pixels: number[];
  cycles: LbmCycle[];
};

export type PaletteInfo = {
  id: number;
  name: string;
  colors: number[][];
  cycles: LbmCycle[];
  startSeconds: number;
  endSeconds: number;
};

export type DPaintJsCycle = {
  active: boolean;
  fps: number;
  high: number;
  index: number;
  low: number;
  max: number;
  reverse: boolean;
  rate: number;
};

export type DPaintJsData = {
  type: string;
  colorRange: DPaintJsCycle[];
  image: {
    name: string;
    width: number;
    height: number;
  };
  palette: number[][];
  indexedPixels: number[][];
};

export type OverlayInfo = {
  id: number;
  name: string;
  width: number;
  height: number;
  pixels: number[];
};

export type StorageData = {
  name: string;
  width: number;
  height: number;
  paletteInfos: PaletteInfo[];
  pixels: number[];
  overlays: OverlayInfo[];
};

export type StorageContainer = {
  format: {
    version: number;
    type: string;
  };
  data: StorageData;
};
