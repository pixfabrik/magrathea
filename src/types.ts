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
};

export type DPaintJsData = {
  colorRange: DPaintJsCycle[];
  image: {
    name: string;
    width: number;
    height: number;
  };
  palette: number[][];
  indexedPixels: number[][];
};

export type StorageData = {
  name: string;
  width: number;
  height: number;
  paletteInfos: PaletteInfo[];
  pixels: number[];
};

export type StorageContainer = {
  format: {
    version: number;
    type: string;
  };
  data: StorageData;
};
