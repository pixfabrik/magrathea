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
