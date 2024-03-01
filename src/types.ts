import { WorldData } from "./WorldData";

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

export type StorageContainer = {
  format: {
    version: number;
    type: string;
  };
  data: WorldData;
};
