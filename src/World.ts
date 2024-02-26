/* eslint-disable @typescript-eslint/no-unused-vars */
import { saveAs } from "file-saver";
import {
  LbmCycle,
  LbmData,
  PaletteInfo,
  StorageContainer,
  StorageData,
} from "./types";
import { importFile, mapLinear } from "./util";
import { maxSeconds, LBM_CYCLE_RATE_DIVISOR } from "./vars";

const worldStorageKey = "world";

// ----------
export default class World {
  name: string = "";
  width: number = 0;
  height: number = 0;
  pixels: number[] = [];
  currentColors: number[][] = [];
  ctx: CanvasRenderingContext2D | null = null;
  pixelData: Uint8ClampedArray = new Uint8ClampedArray(0);
  paletteInfos: PaletteInfo[] = [];
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
    // Find current palette infos
    let startPaletteInfo: PaletteInfo | null = null,
      endPaletteInfo: PaletteInfo | null = null;

    for (const paletteInfo of this.paletteInfos) {
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

    this.name = data.name;
    this.width = data.width;
    this.height = data.height;
    this.pixels = data.pixels;

    this.updateForImage();
    this.loadColors(data);
  }

  // ----------
  updateForImage() {
    this.firstDraw = true;
    this.pixelData = new Uint8ClampedArray(4 * this.width * this.height);

    if (this.ctx) {
      const canvas = this.ctx.canvas;
      canvas.width = this.width;
      canvas.height = this.height;
      this.handleResize();
    }
  }

  // ----------
  handleResize = () => {
    if (this.ctx && this.width && this.height) {
      const canvas = this.ctx.canvas;
      const container = canvas.parentElement;
      if (container) {
        const containerAspect = container.clientWidth / container.clientHeight;
        const imageAspect = this.width / this.height;
        if (containerAspect > imageAspect) {
          canvas.classList.add("height-bound");
        } else {
          canvas.classList.remove("height-bound");
        }
      }
    }
  };

  // ----------
  getNextPaletteId() {
    let id = 1;
    for (const paletteInfo of this.paletteInfos) {
      if (paletteInfo.id >= id) {
        id = paletteInfo.id + 1;
      }
    }
    return id;
  }

  // ----------
  loadColors(data: LbmData) {
    let seconds = 0;
    if (this.paletteInfos.length) {
      const startPaletteInfo = this.paletteInfos[this.paletteInfos.length - 1];
      startPaletteInfo.endSeconds = startPaletteInfo.startSeconds + 60;
      seconds = startPaletteInfo.endSeconds + 5;
    }

    const endPaletteInfo = {
      id: this.getNextPaletteId(),
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

    this.paletteInfos.push(endPaletteInfo);

    this.save();

    if (this.onChange) {
      this.onChange();
    }
  }

  // ----------
  deletePalette(paletteIndex: number) {
    this.paletteInfos.splice(paletteIndex, 1);
    this.save();

    if (this.onChange) {
      this.onChange();
    }
  }

  // ----------
  updatePalette(paletteIndex: number, newInfo: Partial<PaletteInfo>) {
    const paletteInfo = this.paletteInfos[paletteIndex];
    Object.assign(paletteInfo, newInfo);

    this.sortPalettes();
    this.save();

    if (this.onChange) {
      this.onChange();
    }
  }

  // ----------
  sortPalettes() {
    this.paletteInfos.sort((a, b) => a.startSeconds - b.startSeconds);

    this.isBad = false;
    this.paletteStatuses.length = 0;

    for (let i = 0; i < this.paletteInfos.length; i++) {
      this.paletteStatuses[i] = "good";
    }

    for (let i = 0; i < this.paletteInfos.length; i++) {
      const paletteInfo = this.paletteInfos[i];
      if (paletteInfo.endSeconds < paletteInfo.startSeconds) {
        this.paletteStatuses[i] = "bad";
        this.isBad = true;
      }

      const nextPaletteInfo = this.paletteInfos[i + 1];
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
    const {
      width,
      height,
      currentColors,
      pixels,
      ctx,
      pixelData,
      isBad,
      firstDraw,
    } = this;
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

    // Create an ImageData object with the pixel data
    const imageData = new ImageData(pixelData, width, height);

    ctx.putImageData(imageData, 0, 0);
  }

  // ----------
  serialize() {
    const object = {
      format: {
        version: 1,
        type: "Magrathea World",
      },
      data: {
        name: this.name,
        width: this.width,
        height: this.height,
        paletteInfos: this.paletteInfos,
        pixels: this.pixels,
      },
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

      if (!fileData.format || fileData.format.type !== "Magrathea World") {
        throw new Error("Wrong file type.");
      }

      if (fileData.format.version !== 1) {
        throw new Error("Wrong file version.");
      }

      if (!fileData.data) {
        throw new Error("Damaged file.");
      }

      this.ingestData(fileData.data);

      this.save();

      if (this.onChange) {
        this.onChange();
      }
    } catch (err) {
      alert("Error importing: " + err);
    }
  }

  // ----------
  ingestData(parsedData: StorageData) {
    this.name = parsedData.name;
    this.width = parsedData.width;
    this.height = parsedData.height;
    this.paletteInfos = parsedData.paletteInfos;

    // console.log(parsedData);

    for (const paletteInfo of this.paletteInfos) {
      if (paletteInfo.endSeconds === null) {
        paletteInfo.endSeconds = maxSeconds - 1;
      }

      paletteInfo.startSeconds %= maxSeconds;
      paletteInfo.endSeconds %= maxSeconds;
    }

    this.sortPalettes();

    this.pixels = parsedData.pixels;
    this.updateForImage();

    // console.log(this.paletteInfos);
  }
}
