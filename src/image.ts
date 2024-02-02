type LbmData = {
  width: number;
  height: number;
  colors: number[][];
  pixels: number[];
};

export function loadImage(data: LbmData, canvas: HTMLCanvasElement) {
  const { width, height, colors, pixels } = data;
  canvas.width = width;
  canvas.height = height;

  if (pixels.length !== width * height) {
    console.error("bad size");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const pixelData = new Uint8ClampedArray(4 * width * height);
  for (let i = 0; i < pixels.length; i++) {
    const pixel = pixels[i];
    const color = colors[pixel];
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
