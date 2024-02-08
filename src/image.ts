import { LbmCycle, LbmData } from "./types";

const LBM_CYCLE_RATE_DIVISOR = 280;

// ----------
export class Image {
  width: number;
  height: number;
  pixels: number[];
  cycles: LbmCycle[];
  currentColors: number[][];
  ctx: CanvasRenderingContext2D;
  pixelData: Uint8ClampedArray;
  running: boolean;
  cycleProgresses: number[];

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
    this.cycles = cycles.filter((cycle) => cycle.low !== cycle.high);
    this.cycleProgresses = this.cycles.map(() => 0);
    this.running = true;

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

    let lastTime = Date.now();
    const frame = () => {
      if (!this.running) {
        return;
      }

      requestAnimationFrame(frame);

      const now = Date.now();
      const secondsDiff = (now - lastTime) / 1000;
      lastTime = now;

      for (let i = 0; i < this.cycles.length; i++) {
        const cycle = cycles[i];
        const cycleRate = cycle.rate / LBM_CYCLE_RATE_DIVISOR;
        this.cycleProgresses[i] += secondsDiff * cycleRate;
        if (this.cycleProgresses[i] > 1) {
          this.cycleProgresses[i]--;
          let low = cycle.low;
          let high = cycle.high;
          if (cycle.reverse === 2) {
            [low, high] = [high, low];
          }

          this.currentColors.splice(
            low,
            0,
            this.currentColors.splice(high, 1)[0]
          );
        }
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
