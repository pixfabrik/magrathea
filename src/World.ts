/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from "lodash";
import { saveAs } from "file-saver";
import { LbmCycle, LbmData, StorageContainer } from "./types";
import {
  EventInfo,
  getEmptyEventInfo,
  getEmptyModeInfo,
  getEmptyWorldData,
  isValidWorldData,
  ModeInfo,
  ModePaletteInfo,
  OverlayInfo,
  PaletteInfo,
  PaletteInfoV1,
  WorldData,
} from "./WorldData";
import {
  getDateString,
  getNextId,
  importFile,
  lerp,
  mapLinear,
  pluralize,
} from "./util";
import {
  maxSeconds,
  LBM_CYCLE_RATE_DIVISOR,
  WORLD_DATA_VERSION,
  WORLD_DATA_TYPE,
} from "./vars";
import Scheduler from "./Scheduler";

type ModePalette = {
  colors: number[][];
  cycles: LbmCycle[];
  modeStatus: string;
  paletteStatus: string;
};

type ModePaletteStatus = "good" | "bad";

const worldStorageKey = "world";

// ----------
export default class World {
  data: WorldData = getEmptyWorldData();
  currentColors: number[][] = [];
  ctx: CanvasRenderingContext2D | null = null;
  pixelData: Uint8ClampedArray = new Uint8ClampedArray(0);
  modePaletteStatuses: ModePaletteStatus[][] = [];
  isBad: boolean = false;
  firstDraw: boolean = true;
  viewMode = "letterbox";

  scheduler = new Scheduler(this);
  onChange: (() => void) | null = null;

  // ----------
  constructor(sceneUrl: string | null = null) {
    window.addEventListener("resize", this.handleResize);

    if (sceneUrl) {
      fetch(sceneUrl)
        .then((response) => response.json())
        .then((parsedStorage) => {
          const parsedData = parsedStorage.data;
          const version = parsedStorage.format.version;
          this.ingestData(parsedData, version);
        });
    } else {
      const storage = localStorage.getItem(worldStorageKey);
      if (storage) {
        try {
          const parsedStorage = JSON.parse(storage);
          if (typeof parsedStorage === "object") {
            // console.log("storage", typeof parsedStorage, parsedStorage);
            let parsedData, version;
            if (parsedStorage.format) {
              parsedData = parsedStorage.data;
              version = parsedStorage.format.version;
            } else {
              parsedData = parsedStorage;
              version = 0;
            }

            this.ingestData(parsedData, version);
          }
        } catch (err) {
          console.error("Error parsing world data:", err);
        }
      }
    }
  }

  // ----------
  destroy() {
    window.removeEventListener("resize", this.handleResize);
  }

  // ----------
  frame(nowSeconds: number) {
    const nowRealSeconds = Date.now() / 1000;

    const status = {
      mode: "",
      palette: "",
    };

    // Pan scene
    if (this.viewMode === "pan" && this.ctx) {
      const now = Date.now();
      let panFactor = (now * 0.0000001) % 2;
      if (panFactor > 1) {
        panFactor = 2 - panFactor;
      }

      const canvas = this.ctx.canvas;
      const container = canvas.parentElement;
      if (container) {
        const diffX = canvas.clientWidth - container.clientWidth;
        const diffY = canvas.clientHeight - container.clientHeight;
        let panX = 0;
        let panY = 0;

        if (diffX > 0) {
          panX = Math.round(lerp(-diffX / 2, diffX / 2, panFactor));
        }

        if (diffY > 0) {
          panY = Math.round(lerp(-diffY / 2, diffY / 2, panFactor));
        }

        canvas.style.transform = `translate(${panX}px, ${panY}px)`;
      }
    }

    // Animate scene
    const currentModeInfos = this.scheduler.getCurrentModeInfos(nowSeconds);

    let startModePalette: ModePalette | null = null;
    let endModePalette: ModePalette | null = null;

    if (currentModeInfos.startModeInfo) {
      startModePalette = this.getModePalette(
        currentModeInfos.startModeInfo,
        nowSeconds
      );
    }

    if (currentModeInfos.endModeInfo) {
      endModePalette = this.getModePalette(
        currentModeInfos.endModeInfo,
        nowSeconds
      );
    }

    if (startModePalette) {
      let colors: number[][] = [];
      if (startModePalette && endModePalette) {
        colors = this.blendPaletteColors(
          startModePalette.colors,
          endModePalette.colors,
          currentModeInfos.progress
        );

        status.mode = `${startModePalette.modeStatus} => ${endModePalette.modeStatus}`;
        status.palette = `${startModePalette.paletteStatus} => ${endModePalette.paletteStatus}`;
      } else {
        colors = startModePalette.colors;
        status.mode = startModePalette.modeStatus;
        status.palette = startModePalette.paletteStatus;
      }

      // TODO: Do a better job about blending cycles
      const cycles = startModePalette.cycles;

      for (let i = 0; i < cycles.length; i++) {
        const cycle = cycles[i];
        let low = cycle.low;
        let high = cycle.high;
        const cycleSize = high - low + 1;
        const cycleRate = cycle.rate / LBM_CYCLE_RATE_DIVISOR;
        const cycleAmount = (cycleRate * nowRealSeconds) % cycleSize;
        if (cycle.reverse === 2) {
          [low, high] = [high, low];
        }

        for (let j = 0; j < cycleAmount; j++) {
          colors.splice(low, 0, colors.splice(high, 1)[0]);
        }
      }

      this.currentColors = colors;
    }

    const drawStatus = this.draw(nowSeconds);

    const statusArray = [];

    if (drawStatus.error) {
      statusArray.push(drawStatus.error);
    } else {
      if (status.mode) {
        statusArray.push(`Mode: ${status.mode}`);
      }

      if (status.palette) {
        statusArray.push(`Palette: ${status.palette}`);
      }

      if (drawStatus.events.length) {
        statusArray.push(
          `${pluralize(
            "Event",
            drawStatus.events.length
          )}: ${drawStatus.events.join(", ")}`
        );
      }

      if (drawStatus.overlays.length) {
        statusArray.push(
          `${pluralize(
            "Overlay",
            drawStatus.overlays.length
          )}: ${drawStatus.overlays.join(", ")}`
        );
      }
    }

    return statusArray.join(" - ");
  }

  // ----------
  getModePalette(modeInfo: ModeInfo, nowSeconds: number): ModePalette | null {
    const { paletteInfos } = this.data;
    let modeStatus = "";
    let paletteStatus = "";
    let startModePaletteInfo: ModePaletteInfo | null = null;
    let endModePaletteInfo: ModePaletteInfo | null = null;
    let startPaletteInfo: PaletteInfo | null = null;
    let endPaletteInfo: PaletteInfo | null = null;

    if (modeInfo) {
      for (const modePaletteInfo of modeInfo.modePaletteInfos) {
        if (modePaletteInfo.paletteId === -1) {
          continue;
        }

        if (nowSeconds >= modePaletteInfo.startSeconds) {
          startModePaletteInfo = modePaletteInfo;

          if (nowSeconds < modePaletteInfo.endSeconds) {
            endModePaletteInfo = null;
            break;
          }
        } else if (startModePaletteInfo) {
          endModePaletteInfo = modePaletteInfo;
          break;
        } else {
          startModePaletteInfo = modePaletteInfo;
          break;
        }
      }

      if (startModePaletteInfo) {
        startPaletteInfo =
          paletteInfos.find(
            (paletteInfo) => paletteInfo.id === startModePaletteInfo!.paletteId
          ) || null;
      }

      if (endModePaletteInfo) {
        endPaletteInfo =
          paletteInfos.find(
            (paletteInfo) => paletteInfo.id === endModePaletteInfo!.paletteId
          ) || null;
      }

      if (startPaletteInfo) {
        modeStatus = modeInfo.name;
      }
    }

    if (!startPaletteInfo) {
      startPaletteInfo = paletteInfos[0];
    }

    if (startPaletteInfo) {
      let colors: number[][] = [];
      let cycles: LbmCycle[] = [];
      if (startModePaletteInfo && endModePaletteInfo && endPaletteInfo) {
        paletteStatus = `${startPaletteInfo.name} -> ${endPaletteInfo.name}`;

        const progress = mapLinear(
          nowSeconds,
          startModePaletteInfo.endSeconds,
          endModePaletteInfo.startSeconds,
          0,
          1,
          true
        );

        colors = this.blendPaletteColors(
          startPaletteInfo.colors,
          endPaletteInfo.colors,
          progress
        );

        cycles = startPaletteInfo.cycles;
      } else {
        paletteStatus = startPaletteInfo.name;
        colors = startPaletteInfo.colors.slice();
        cycles = startPaletteInfo.cycles;
      }

      return { colors, cycles, modeStatus, paletteStatus };
    }

    return null;
  }

  // ----------
  blendPaletteColors(
    startColors: number[][],
    endColors: number[][],
    progress: number
  ) {
    const newColors = [];
    const count = Math.max(startColors.length, endColors.length);
    for (let i = 0; i < count; i++) {
      const startColor = startColors[i];
      const endColor = endColors[i];
      if (startColor) {
        if (endColor) {
          newColors.push([
            startColor[0] + (endColor[0] - startColor[0]) * progress,
            startColor[1] + (endColor[1] - startColor[1]) * progress,
            startColor[2] + (endColor[2] - startColor[2]) * progress,
          ]);
        } else {
          newColors.push(startColor);
        }
      } else if (endColor) {
        newColors.push(endColor);
      } else {
        newColors.push([0, 0, 0]);
      }
    }

    return newColors;
  }

  // ----------
  setCanvas(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.updateForImage();
    this.updateForViewMode();
  }

  // ----------
  loadImage(data: LbmData) {
    if (data.layers.length === 0) {
      console.error("no layers");
      return;
    }

    const pixels = data.layers[0].pixels;
    if (pixels.length !== data.width * data.height) {
      console.error(
        "bad size",
        pixels.length,
        data.width,
        data.height,
        data.width * data.height
      );
      return;
    }

    this.data.name = data.name;
    this.data.width = data.width;
    this.data.height = data.height;
    this.data.pixels = pixels;

    for (let i = 1; i < data.layers.length; i++) {
      const layer = data.layers[i];
      this.data.overlays.push({
        id: getNextId(this.data.overlays),
        name: layer.name,
        width: data.width,
        height: data.height,
        pixels: layer.pixels,
      });
    }

    this.updateForImage();
    this.loadColors(data);
  }

  // ----------
  updateForImage() {
    const { width, height } = this.data;
    this.firstDraw = true;
    this.pixelData = new Uint8ClampedArray(4 * width * height);

    if (this.ctx) {
      const canvas = this.ctx.canvas;
      canvas.width = width;
      canvas.height = height;
      this.handleResize();
    }
  }

  // ----------
  loadOverlay(data: LbmData) {
    const { overlays } = this.data;

    if (data.layers.length === 0) {
      console.error("no layers");
      return;
    }

    for (let i = 0; i < data.layers.length; i++) {
      const layer = data.layers[i];
      this.data.overlays.push({
        id: getNextId(this.data.overlays),
        name: layer.name,
        width: data.width,
        height: data.height,
        pixels: layer.pixels,
      });
    }

    this.handleChange();
  }

  // ----------
  deleteOverlay(overlayIndex: number) {
    const { overlays } = this.data;
    const overlayInfo = overlays[overlayIndex];
    if (overlayInfo) {
      overlays.splice(overlayIndex, 1);

      for (const eventInfo of this.data.events) {
        if (eventInfo.overlayId === overlayInfo.id) {
          eventInfo.overlayId = -1;
        }
      }

      this.handleChange();
    }
  }

  // ----------
  updateOverlay(overlayIndex: number, newInfo: Partial<OverlayInfo>) {
    const { overlays } = this.data;
    const overlayInfo = overlays[overlayIndex];
    Object.assign(overlayInfo, newInfo);

    this.handleChange();
  }

  // ----------
  getEventInfo(id: number) {
    return this.data.events.find((eventInfo) => eventInfo.id === id);
  }

  // ----------
  addEvent() {
    const { events } = this.data;
    const id = getNextId(events);
    const eventInfo = getEmptyEventInfo();
    eventInfo.id = id;
    eventInfo.name = `Event ${id}`;
    events.push(eventInfo);

    this.handleChange();
    return eventInfo;
  }

  // ----------
  updateEvent(eventIndex: number, newInfo: Partial<EventInfo>) {
    const { events } = this.data;
    const eventInfo = events[eventIndex];
    Object.assign(eventInfo, newInfo);
    this.handleChange();
  }

  // ----------
  deleteEvent(eventIndex: number) {
    const { events } = this.data;
    events.splice(eventIndex, 1);
    this.handleChange();
  }

  // ----------
  addMode() {
    const { modes } = this.data;
    const id = getNextId(modes);
    const modeInfo = getEmptyModeInfo();
    modeInfo.id = id;
    modeInfo.name = `Mode ${id}`;
    modes.push(modeInfo);

    this.handleChange();
    return modeInfo;
  }

  // ----------
  addModePalette(modeIndex: number) {
    const { modes } = this.data;
    const modeInfo = modes[modeIndex];
    if (!modeInfo) {
      return;
    }

    const modePaletteInfos = modeInfo.modePaletteInfos;
    let seconds = 0;
    if (modePaletteInfos.length) {
      const startModePaletteInfo =
        modePaletteInfos[modePaletteInfos.length - 1];
      startModePaletteInfo.endSeconds = startModePaletteInfo.startSeconds + 60;
      seconds = startModePaletteInfo.endSeconds + 5;
    }

    modeInfo.modePaletteInfos.push({
      id: getNextId(modeInfo.modePaletteInfos),
      paletteId: -1,
      startSeconds: seconds,
      endSeconds: maxSeconds - 1,
    });

    this.sortModePalettes();
    this.handleChange();
  }

  // ----------
  updateMode(modeIndex: number, newInfo: Partial<ModeInfo>) {
    const { modes } = this.data;
    const modeInfo = modes[modeIndex];
    Object.assign(modeInfo, newInfo);
    this.handleChange();
  }

  // ----------
  updateModePalette(
    modeIndex: number,
    modePaletteIndex: number,
    newInfo: Partial<ModePaletteInfo>
  ) {
    const { modes } = this.data;
    const modeInfo = modes[modeIndex];
    if (modeInfo) {
      const modePaletteInfo = modeInfo.modePaletteInfos[modePaletteIndex];
      if (modePaletteInfo) {
        Object.assign(modePaletteInfo, newInfo);
        this.sortModePalettes();
        this.handleChange();
      }
    }
  }

  // ----------
  deleteMode(modeIndex: number) {
    const { modes } = this.data;
    modes.splice(modeIndex, 1);
    this.handleChange();
  }

  // ----------
  deleteModePalette(modeIndex: number, modePaletteIndex: number) {
    const { modes } = this.data;
    const modeInfo = modes[modeIndex];
    if (modeInfo) {
      modeInfo.modePaletteInfos.splice(modePaletteIndex, 1);
      this.handleChange();
    }
  }

  // ----------
  handleChange() {
    this.save();

    if (this.onChange) {
      this.onChange();
    }
  }

  // ----------
  handleResize = () => {
    const { width, height } = this.data;
    if (this.ctx && width && height) {
      const canvas = this.ctx.canvas;
      const container = canvas.parentElement;
      if (container) {
        const containerAspect = container.clientWidth / container.clientHeight;
        const imageAspect = width / height;
        if (containerAspect > imageAspect) {
          canvas.classList.add("height-bound");
        } else {
          canvas.classList.remove("height-bound");
        }
      }
    }
  };

  // ----------
  loadColors(data: LbmData) {
    const { paletteInfos } = this.data;

    const endPaletteInfo = {
      id: getNextId(paletteInfos),
      name: data.name,
      colors: data.colors,
      cycles: data.cycles.filter((cycle) => cycle.low !== cycle.high),
    };

    for (const cycle of endPaletteInfo.cycles) {
      if (cycle.reverse !== 0 && cycle.reverse !== 2) {
        console.warn("bad reverse:", cycle.reverse);
      }
    }

    paletteInfos.push(endPaletteInfo);
    this.handleChange();
  }

  // ----------
  deletePalette(paletteIndex: number) {
    const { paletteInfos } = this.data;
    const paletteInfo = paletteInfos[paletteIndex];
    if (paletteInfo) {
      paletteInfos.splice(paletteIndex, 1);

      for (const modeInfo of this.data.modes) {
        for (const modePaletteInfo of modeInfo.modePaletteInfos) {
          if (modePaletteInfo.paletteId === paletteInfo.id) {
            modePaletteInfo.paletteId = -1;
          }
        }
      }

      this.handleChange();
    }
  }

  // ----------
  updatePalette(paletteIndex: number, newInfo: Partial<PaletteInfo>) {
    const { paletteInfos } = this.data;
    const paletteInfo = paletteInfos[paletteIndex];
    Object.assign(paletteInfo, newInfo);

    this.handleChange();
  }

  // ----------
  sortModePalettes() {
    const { modes } = this.data;
    const { modePaletteStatuses } = this;
    modePaletteStatuses.length = 0;
    this.isBad = false; // TODO: Have this per mode

    for (const mode of modes) {
      const modePaletteInfos = mode.modePaletteInfos;
      modePaletteInfos.sort((a, b) => a.startSeconds - b.startSeconds);

      const statuses: ModePaletteStatus[] = [];
      modePaletteStatuses.push(statuses);

      for (let i = 0; i < modePaletteInfos.length; i++) {
        statuses[i] = "good";
      }

      for (let i = 0; i < modePaletteInfos.length; i++) {
        const modePaletteInfo = modePaletteInfos[i];
        if (modePaletteInfo.endSeconds < modePaletteInfo.startSeconds) {
          statuses[i] = "bad";
          this.isBad = true;
        }

        const nextmodePaletteInfo = modePaletteInfos[i + 1];
        if (
          nextmodePaletteInfo &&
          modePaletteInfo.endSeconds > nextmodePaletteInfo.startSeconds
        ) {
          statuses[i] = "bad";
          statuses[i + 1] = "bad";
          this.isBad = true;
        }
      }
    }
  }

  // ----------
  draw(nowSeconds: number) {
    const { currentColors, ctx, pixelData, isBad, firstDraw, scheduler } = this;

    const { width, height, pixels, overlays, events } = this.data;

    const status: {
      error: string;
      events: string[];
      overlays: string[];
    } = {
      error: "",
      events: [],
      overlays: [],
    };

    if (!ctx || !width || !height) {
      status.error = "No base pixels.";
      return status;
    }

    if (!currentColors.length) {
      status.error = "No palette.";
      return status;
    }

    if (isBad && !firstDraw) {
      status.error = "The palette sequence in the current mode has overlaps.";
      return status;
    }

    this.firstDraw = false;

    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      const p = i * 4;
      const color = currentColors[pixel];
      if (color) {
        pixelData[p] = color[0]; // Red channel
        pixelData[p + 1] = color[1]; // Green channel
        pixelData[p + 2] = color[2]; // Blue channel
        pixelData[p + 3] = 255; // Alpha channel (opacity)
      } else {
        pixelData[p] = 0; // Red channel
        pixelData[p + 1] = 0; // Green channel
        pixelData[p + 2] = 0; // Blue channel
        pixelData[p + 3] = 0; // Alpha channel (opacity)
      }
    }

    const scheduleEvents = scheduler.getEvents(nowSeconds);

    for (const scheduleEvent of scheduleEvents) {
      if (!scheduleEvent) {
        continue;
      }

      const eventInfo = scheduleEvent.eventInfo;

      const overlay = overlays.find(
        (overlay) => overlay.id === eventInfo.overlayId
      );

      if (!overlay) {
        continue;
      }

      if (eventInfo.name) {
        status.events.push(eventInfo.name);
      }

      status.overlays.push(overlay.name);

      const baseX = Math.round(
        lerp(
          eventInfo.startPosition.x,
          eventInfo.endPosition.x,
          scheduleEvent.progress
        )
      );

      const baseY = Math.round(
        lerp(
          eventInfo.startPosition.y,
          eventInfo.endPosition.y,
          scheduleEvent.progress
        )
      );

      let x = baseX;
      let y = baseY;
      for (let i = 0; i < overlay.pixels.length; i++) {
        const pixel = overlay.pixels[i];
        const color = currentColors[pixel];
        if (pixel && color && x >= 0 && y >= 0 && x < width && y < height) {
          const p = (x + y * width) * 4;
          pixelData[p] = color[0]; // Red channel
          pixelData[p + 1] = color[1]; // Green channel
          pixelData[p + 2] = color[2]; // Blue channel
          pixelData[p + 3] = 255; // Alpha channel (opacity)
        }

        x++;
        if (x >= baseX + overlay.width) {
          x = baseX;
          y++;
        }
      }
    }

    // Create an ImageData object with the pixel data
    const imageData = new ImageData(pixelData, width, height);

    ctx.putImageData(imageData, 0, 0);
    return status;
  }

  // ----------
  serialize() {
    const object = {
      format: {
        version: WORLD_DATA_VERSION,
        type: WORLD_DATA_TYPE,
      },
      data: this.data,
    };

    return JSON.stringify(object);
  }

  // ----------
  save() {
    localStorage.setItem(worldStorageKey, this.serialize());
  }

  // ----------
  doExport() {
    const blob = new Blob([this.serialize()], {
      type: "application/json;charset=utf-8",
    });

    saveAs(blob, `Magrathea World ${getDateString()}.json`);
  }

  // ----------
  async doImport() {
    try {
      const fileData = (await importFile(["json"])) as
        | Partial<StorageContainer>
        | File;
      if (fileData instanceof File) {
        throw new Error("Wrong file type.");
      }

      if (!fileData.format || fileData.format.type !== WORLD_DATA_TYPE) {
        throw new Error("Wrong file type.");
      }

      if (!fileData.data) {
        throw new Error("Damaged file.");
      }

      this.ingestData(fileData.data, fileData.format.version);
      this.handleChange();
    } catch (err) {
      alert("Error importing: " + err);
    }
  }

  // ----------
  ingestData(parsedData: WorldData, version: number) {
    // console.log(parsedData);

    if (version < 2) {
      const modeInfo = getEmptyModeInfo();
      modeInfo.id = 1;
      modeInfo.name = "Mode 1";
      parsedData.modes = [modeInfo];

      for (let i = 0; i < parsedData.paletteInfos.length; i++) {
        const paletteInfo = parsedData.paletteInfos[i] as PaletteInfoV1;

        if (
          paletteInfo.startSeconds !== undefined &&
          paletteInfo.endSeconds !== undefined
        ) {
          if (paletteInfo.endSeconds === null) {
            paletteInfo.endSeconds = maxSeconds - 1;
          }

          paletteInfo.startSeconds %= maxSeconds;
          paletteInfo.endSeconds %= maxSeconds;

          const modePaletteInfo = {
            id: getNextId(modeInfo.modePaletteInfos),
            paletteId: paletteInfo.id,
            startSeconds: paletteInfo.startSeconds,
            endSeconds: paletteInfo.endSeconds,
          };

          modeInfo.modePaletteInfos.push(modePaletteInfo);
        }

        delete paletteInfo.startSeconds;
        delete paletteInfo.endSeconds;
      }
    }

    const newData = _.defaultsDeep(parsedData, getEmptyWorldData());

    for (const event of newData.events) {
      _.defaultsDeep(event, getEmptyEventInfo());
    }

    for (const mode of newData.modes) {
      _.defaultsDeep(mode, getEmptyModeInfo());
      for (const modePalette of mode.modePaletteInfos) {
        if (!modePalette.id) {
          modePalette.id = getNextId(mode.modePaletteInfos);
        }
      }
    }

    if (!isValidWorldData(newData)) {
      // return;
    }

    this.data = newData;

    this.sortModePalettes();
    this.updateForImage();

    // console.log(this.paletteInfos);
  }

  // ----------
  setViewMode(viewMode: string) {
    this.viewMode = viewMode;
    this.updateForViewMode();
  }

  // ----------
  updateForViewMode() {
    if (this.ctx) {
      const canvas = this.ctx.canvas;
      if (this.viewMode === "pan") {
        canvas.classList.add("pan-mode");
      } else {
        canvas.classList.remove("pan-mode");
        canvas.style.transform = "";
      }
    }
  }
}
