/* eslint-disable @typescript-eslint/no-unused-vars */
import { LbmCycle, LbmData, PaletteInfo } from "./types";
import { mapLinear } from "./util";
import { maxSeconds } from "./vars";

const LBM_CYCLE_RATE_DIVISOR = 280;
const worldStorageKey = "world";

// ----------
export default class World {
  width: number = 0;
  height: number = 0;
  pixels: number[] = [];
  currentColors: number[][] = [];
  ctx: CanvasRenderingContext2D | null = null;
  pixelData: Uint8ClampedArray = new Uint8ClampedArray(0);
  paletteInfos: PaletteInfo[] = [];
  onChange: (() => void) | null = null;

  // ----------
  constructor() {
    const data = localStorage.getItem(worldStorageKey);
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        this.width = parsedData.width;
        this.height = parsedData.height;
        this.paletteInfos = parsedData.paletteInfos;

        for (const paletteInfo of this.paletteInfos) {
          if (paletteInfo.endSeconds === null) {
            paletteInfo.endSeconds = maxSeconds - 1;
          }

          paletteInfo.startSeconds %= maxSeconds;
          paletteInfo.endSeconds %= maxSeconds;
        }

        this.pixels = parsedData.pixels;
        this.updateForImage();
      } catch (err) {
        console.error("Error parsing world data:", err);
      }
    }
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
      } else {
        endPaletteInfo = paletteInfo;
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
  destroy() {}

  // ----------
  setCanvas(canvas: HTMLCanvasElement) {
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx = canvas.getContext("2d")!;
    this.updateForImage();
  }

  // ----------
  loadImage(data: LbmData) {
    if (data.pixels.length !== data.width * data.height) {
      console.error("bad size");
      return;
    }

    this.width = data.width;
    this.height = data.height;
    this.pixels = data.pixels;

    this.updateForImage();
    this.loadColors(data);
  }

  // ----------
  updateForImage() {
    this.pixelData = new Uint8ClampedArray(4 * this.width * this.height);

    if (this.ctx) {
      this.ctx.canvas.width = this.width;
      this.ctx.canvas.height = this.height;
    }
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
  draw() {
    const { width, height, currentColors, pixels, ctx, pixelData } = this;
    if (!ctx || !width || !height || !currentColors.length) {
      return;
    }

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
  save() {
    const data = {
      width: this.width,
      height: this.height,
      paletteInfos: this.paletteInfos,
      pixels: this.pixels,
    };

    localStorage.setItem(worldStorageKey, JSON.stringify(data));
  }
}
