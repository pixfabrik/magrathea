/* eslint-disable @typescript-eslint/no-unused-vars */
import { saveAs } from "file-saver";
import { LbmCycle, LbmData, StorageContainer } from "./types";
import { getEmptyWorldData, PaletteInfo, WorldData } from "./WorldData";
import { getNextId, importFile, mapLinear } from "./util";
import {
  maxSeconds,
  LBM_CYCLE_RATE_DIVISOR,
  WORLD_DATA_VERSION,
  WORLD_DATA_TYPE,
} from "./vars";

const worldStorageKey = "world";

// ----------
export default class World {
  data: WorldData = getEmptyWorldData();
  currentColors: number[][] = [];
  ctx: CanvasRenderingContext2D | null = null;
  pixelData: Uint8ClampedArray = new Uint8ClampedArray(0);
  paletteStatuses: ("good" | "bad")[] = [];
  isBad: boolean = false;
  firstDraw: boolean = true;
  onChange: (() => void) | null = null;

  // ----------
  constructor() {
    window.addEventListener("resize", this.handleResize);

    const storage = localStorage.getItem(worldStorageKey);
    if (storage) {
      try {
        const parsedStorage = JSON.parse(storage);
        if (typeof parsedStorage === "object") {
          // console.log("storage", typeof parsedStorage, parsedStorage);
          const parsedData = parsedStorage.data || parsedStorage;
          this.ingestData(parsedData);
        }
      } catch (err) {
        console.error("Error parsing world data:", err);
      }
    }
  }

  // ----------
  destroy() {
    window.removeEventListener("resize", this.handleResize);
  }

  // ----------
  frame(nowSeconds: number) {
    const { paletteInfos } = this.data;
    // Find current palette infos
    let startPaletteInfo: PaletteInfo | null = null,
      endPaletteInfo: PaletteInfo | null = null;

    for (const paletteInfo of paletteInfos) {
      if (nowSeconds >= paletteInfo.startSeconds) {
        startPaletteInfo = paletteInfo;

        if (nowSeconds < paletteInfo.endSeconds) {
          endPaletteInfo = null;
          break;
        }
      } else if (startPaletteInfo) {
        endPaletteInfo = paletteInfo;
        break;
      }
    }

    if (startPaletteInfo) {
      let colors: number[][];
      let cycles: LbmCycle[];
      if (endPaletteInfo) {
        const progress = mapLinear(
          nowSeconds,
          startPaletteInfo.endSeconds,
          endPaletteInfo.startSeconds,
          0,
          1,
          true
        );

        colors = startPaletteInfo.colors.map((startColor, i) => {
          const endColor = endPaletteInfo!.colors[i];
          return [
            startColor[0] + (endColor[0] - startColor[0]) * progress,
            startColor[1] + (endColor[1] - startColor[1]) * progress,
            startColor[2] + (endColor[2] - startColor[2]) * progress,
          ];
        });

        cycles = startPaletteInfo.cycles;
      } else {
        colors = startPaletteInfo.colors.slice();
        cycles = startPaletteInfo.cycles;
      }

      for (let i = 0; i < cycles.length; i++) {
        const cycle = cycles[i];
        let low = cycle.low;
        let high = cycle.high;
        const cycleSize = high - low + 1;
        const cycleRate = cycle.rate / LBM_CYCLE_RATE_DIVISOR;
        const cycleAmount = (cycleRate * nowSeconds) % cycleSize;
        if (cycle.reverse === 2) {
          [low, high] = [high, low];
        }

        for (let j = 0; j < cycleAmount; j++) {
          colors.splice(low, 0, colors.splice(high, 1)[0]);
        }
      }

      this.currentColors = colors;
    }

    this.draw();
  }

  // ----------
  setCanvas(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.updateForImage();
  }

  // ----------
  loadImage(data: LbmData) {
    if (data.pixels.length !== data.width * data.height) {
      console.error(
        "bad size",
        data.pixels.length,
        data.width,
        data.height,
        data.width * data.height
      );
      return;
    }

    this.data.name = data.name;
    this.data.width = data.width;
    this.data.height = data.height;
    this.data.pixels = data.pixels;

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
    overlays.push({
      id: getNextId(overlays),
      name: data.name,
      width: data.width,
      height: data.height,
      pixels: data.pixels,
    });

    this.handleChange();
  }

  // ----------
  deleteOverlay(overlayIndex: number) {
    const { overlays } = this.data;
    overlays.splice(overlayIndex, 1);
    this.handleChange();
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
    let seconds = 0;
    if (paletteInfos.length) {
      const startPaletteInfo = paletteInfos[paletteInfos.length - 1];
      startPaletteInfo.endSeconds = startPaletteInfo.startSeconds + 60;
      seconds = startPaletteInfo.endSeconds + 5;
    }

    const endPaletteInfo = {
      id: getNextId(paletteInfos),
      name: data.name,
      colors: data.colors,
      cycles: data.cycles.filter((cycle) => cycle.low !== cycle.high),
      startSeconds: seconds,
      endSeconds: maxSeconds - 1,
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
    paletteInfos.splice(paletteIndex, 1);
    this.handleChange();
  }

  // ----------
  updatePalette(paletteIndex: number, newInfo: Partial<PaletteInfo>) {
    const { paletteInfos } = this.data;
    const paletteInfo = paletteInfos[paletteIndex];
    Object.assign(paletteInfo, newInfo);

    this.sortPalettes();
    this.handleChange();
  }

  // ----------
  sortPalettes() {
    const { paletteInfos } = this.data;
    paletteInfos.sort((a, b) => a.startSeconds - b.startSeconds);

    this.isBad = false;
    this.paletteStatuses.length = 0;

    for (let i = 0; i < paletteInfos.length; i++) {
      this.paletteStatuses[i] = "good";
    }

    for (let i = 0; i < paletteInfos.length; i++) {
      const paletteInfo = paletteInfos[i];
      if (paletteInfo.endSeconds < paletteInfo.startSeconds) {
        this.paletteStatuses[i] = "bad";
        this.isBad = true;
      }

      const nextPaletteInfo = paletteInfos[i + 1];
      if (
        nextPaletteInfo &&
        paletteInfo.endSeconds > nextPaletteInfo.startSeconds
      ) {
        this.paletteStatuses[i] = "bad";
        this.paletteStatuses[i + 1] = "bad";
        this.isBad = true;
      }
    }
  }

  // ----------
  draw() {
    const { currentColors, ctx, pixelData, isBad, firstDraw } = this;

    const { width, height, pixels, overlays } = this.data;

    if (
      !ctx ||
      !width ||
      !height ||
      !currentColors.length ||
      (isBad && !firstDraw)
    ) {
      return;
    }

    this.firstDraw = false;

    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      const color = currentColors[pixel];
      if (color) {
        const p = i * 4;
        pixelData[p] = color[0]; // Red channel
        pixelData[p + 1] = color[1]; // Green channel
        pixelData[p + 2] = color[2]; // Blue channel
        pixelData[p + 3] = 255; // Alpha channel (opacity)
      }
    }

    for (const overlay of overlays) {
      let x = 0;
      let y = 0;
      for (let i = 0; i < overlay.pixels.length; i++) {
        const pixel = overlay.pixels[i];
        const color = currentColors[pixel];
        if (pixel && color && x < width && y < height) {
          const p = (x + y * width) * 4;
          pixelData[p] = color[0]; // Red channel
          pixelData[p + 1] = color[1]; // Green channel
          pixelData[p + 2] = color[2]; // Blue channel
          pixelData[p + 3] = 255; // Alpha channel (opacity)
        }

        x++;
        if (x >= overlay.width) {
          x = 0;
          y++;
        }
      }
    }

    // Create an ImageData object with the pixel data
    const imageData = new ImageData(pixelData, width, height);

    ctx.putImageData(imageData, 0, 0);
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

    const isoDate = new Date().toISOString().split("T")[0];
    saveAs(blob, `Magrathea World ${isoDate}.json`);
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

      if (fileData.format.version !== WORLD_DATA_VERSION) {
        throw new Error("Wrong file version.");
      }

      if (!fileData.data) {
        throw new Error("Damaged file.");
      }

      this.ingestData(fileData.data);
      this.handleChange();
    } catch (err) {
      alert("Error importing: " + err);
    }
  }

  // ----------
  ingestData(parsedData: WorldData) {
    this.data.name = parsedData.name;
    this.data.width = parsedData.width;
    this.data.height = parsedData.height;
    this.data.paletteInfos = parsedData.paletteInfos;
    this.data.overlays = parsedData.overlays || [];

    // console.log(parsedData);

    for (const paletteInfo of this.data.paletteInfos) {
      if (paletteInfo.endSeconds === null) {
        paletteInfo.endSeconds = maxSeconds - 1;
      }

      paletteInfo.startSeconds %= maxSeconds;
      paletteInfo.endSeconds %= maxSeconds;
    }

    this.sortPalettes();

    this.data.pixels = parsedData.pixels;
    this.updateForImage();

    // console.log(this.paletteInfos);
  }
}
