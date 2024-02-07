type LbmCycle = {
  low: number;
  high: number;
};

type LbmData = {
  width: number;
  height: number;
  colors: number[][];
  pixels: number[];
  cycles: LbmCycle[];
};

export class Image {
  width: number;
  height: number;
  pixels: number[];
  currentColors: number[][];
  ctx: CanvasRenderingContext2D;
  pixelData: Uint8ClampedArray;
  interval: number = 0;

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

    if (pixels.length !== width * height) {
      console.error("bad size");
      return;
    }

    this.interval = setInterval(() => {
      for (let i = 0; i < cycles.length; i++) {
        const cycle = cycles[i];
        const low = cycle.low;
        const high = cycle.high;
        this.currentColors.splice(
          low,
          0,
          this.currentColors.splice(high, 1)[0]
        );
      }

      this.draw();
    }, 100);
  }

  // ----------
  destroy() {
    // Stop the animation
    clearInterval(this.interval);
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
