export type LbmCycle = {
  low: number;
  high: number;
  rate: number;
  reverse: number;
};

export type LbmData = {
  width: number;
  height: number;
  colors: number[][];
  pixels: number[];
  cycles: LbmCycle[];
};

export type PaletteInfo = {
  colors: number[][];
  cycles: LbmCycle[];
  startSeconds: number;
  endSeconds: number;
};
