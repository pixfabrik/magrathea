import { LbmCycle, Point } from "./types";

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

export type EventInfo = {
  id: number;
  name: string;
  durationSeconds: number;
  overlayId: number;
  startPosition: Point;
  endPosition: Point;
};

export type ModePaletteInfo = {
  paletteId: number;
  startSeconds: number;
  endSeconds: number;
};

export type ModeInfo = {
  id: number;
  name: string;
  modePaletteInfos: ModePaletteInfo[];
};

export type WorldData = {
  name: string;
  width: number;
  height: number;
  paletteInfos: PaletteInfo[];
  pixels: number[];
  overlays: OverlayInfo[];
  events: EventInfo[];
  modes: ModeInfo[];
};

// ----------
export function getEmptyEventInfo(): EventInfo {
  return {
    id: 0,
    name: "",
    durationSeconds: 5,
    overlayId: -1,
    startPosition: { x: 0, y: 0 },
    endPosition: { x: 0, y: 0 },
  };
}

// ----------
export function getEmptyModeInfo(): ModeInfo {
  return {
    id: 0,
    name: "",
    modePaletteInfos: [],
  };
}

// ----------
export function getEmptyWorldData(): WorldData {
  return {
    name: "",
    width: 0,
    height: 0,
    paletteInfos: [],
    pixels: [],
    overlays: [],
    events: [],
    modes: [],
  };
}

// ----------
export function isValidWorldData(worldData: WorldData): boolean {
  if (
    worldData.width <= 0 ||
    worldData.height <= 0 ||
    worldData.pixels.length !== worldData.width * worldData.height
  ) {
    console.error("Invalid world data:", worldData);
    return false;
  }

  for (const eventInfo of worldData.events) {
    if (eventInfo.id <= 0) {
      console.error("Invalid eventInfo:", eventInfo);
      return false;
    }
  }

  for (const modeInfo of worldData.modes) {
    if (modeInfo.id <= 0) {
      console.error("Invalid modeInfo:", modeInfo);
      return false;
    }
  }

  return true;
}
