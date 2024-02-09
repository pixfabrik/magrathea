import { LbmCycle, LbmData } from "./types";
import { mapLinear } from "./util";

type PaletteInfo = {
  colors: number[][];
  cycles: LbmCycle[];
  startSeconds: number;
  endSeconds: number;
};

const LBM_CYCLE_RATE_DIVISOR = 280;

// ----------
function getSeconds() {
  return Date.now() / 1000;
}

// ----------
export class Image {
  width: number;
  height: number;
  pixels: number[];
  // cycles: LbmCycle[];
  currentColors: number[][];
  ctx: CanvasRenderingContext2D;
  pixelData: Uint8ClampedArray;
  running: boolean;
  // cycleProgresses: number[];
  paletteInfos: PaletteInfo[] = [];

  // ----------
  constructor(data: LbmData, canvas: HTMLCanvasElement) {
    const { width, height, colors, pixels, cycles } = data;
    canvas.width = width;
    canvas.height = height;
    this.width = width;
    this.height = height;
    this.pixels = pixels;
    this.currentColors = colors.slice();
    this.pixelData = new Uint8ClampedArray(4 * width * height);
    this.ctx = canvas.getContext("2d")!;
    // this.cycles = cycles.filter((cycle) => cycle.low !== cycle.high);
    // this.cycleProgresses = this.cycles.map(() => 0);
    this.running = true;

    const startPaletteInfo = {
      colors: data.colors,
      cycles: data.cycles.filter((cycle) => cycle.low !== cycle.high),
      startSeconds: 0,
      endSeconds: Infinity,
    };

    this.paletteInfos[0] = startPaletteInfo;

    // console.log("cycles: ", this.cycles);

    for (const cycle of cycles) {
      if (cycle.reverse !== 0 && cycle.reverse !== 2) {
        console.warn("bad reverse:", cycle.reverse);
      }
    }

    if (pixels.length !== width * height) {
      console.error("bad size");
      return;
    }

    // let lastSeconds = getSeconds();
    const frame = () => {
      if (!this.running) {
        return;
      }

      requestAnimationFrame(frame);

      const nowSeconds = getSeconds();
      // const secondsDiff = (nowSeconds - lastSeconds) / 1000;
      // lastSeconds = nowSeconds;

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
    };

    requestAnimationFrame(frame);
  }

  // ----------
  destroy() {
    // Stop the animation
    this.running = false;
  }

  // ----------
  loadColors(data: LbmData) {
    const startPaletteInfo = this.paletteInfos[0];
    startPaletteInfo.endSeconds = getSeconds();

    const endPaletteInfo = {
      colors: data.colors,
      cycles: data.cycles.filter((cycle) => cycle.low !== cycle.high),
      startSeconds: startPaletteInfo.endSeconds + 5,
      endSeconds: Infinity,
    };

    this.paletteInfos[1] = endPaletteInfo;
    // this.currentColors = data.colors.slice();
    // this.cycles = data.cycles.filter((cycle) => cycle.low !== cycle.high);
    // this.cycleProgresses = this.cycles.map(() => 0);
  }

  // ----------
  draw() {
    const { width, height, currentColors, pixels, ctx, pixelData } = this;

    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      const color = currentColors[pixel];
      const p = i * 4;
      pixelData[p] = color[0]; // Red channel
      pixelData[p + 1] = color[1]; // Green channel
      pixelData[p + 2] = color[2]; // Blue channel
      pixelData[p + 3] = 255; // Alpha channel (opacity)
    }

    // Create an ImageData object with the pixel data
    const imageData = new ImageData(pixelData, width, height);

    ctx.putImageData(imageData, 0, 0);
  }
}
