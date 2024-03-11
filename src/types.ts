import { WorldData } from "./WorldData";

export type Point = { x: number; y: number };

export type ObjectWithId = {
  id: number;
};

export type LbmCycle = {
  low: number;
  high: number;
  rate: number;
  reverse: number;
};

export type LbmLayer = {
  name: string;
  pixels: number[];
};

export type LbmData = {
  name: string;
  width: number;
  height: number;
  colors: number[][];
  layers: LbmLayer[];
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

export type DPaintJsLayer = {
  name: string;
  indexedPixels: number[][];
};

export type DPaintJsFrame = {
  layers: DPaintJsLayer[];
};

export type DPaintJsData = {
  type: string;
  colorRange: DPaintJsCycle[];
  image: {
    name: string;
    width: number;
    height: number;
    frames: DPaintJsFrame[];
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
