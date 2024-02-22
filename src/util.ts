/* eslint-disable @typescript-eslint/no-unused-vars */

import { LbmData, LbmCycle, DPaintJsCycle } from "./types";
import { LBM_CYCLE_RATE_DIVISOR } from "./vars";

// ----------
export function mapLinear(
  x: number,
  a1: number,
  a2: number,
  b1: number,
  b2: number,
  clamp: boolean
) {
  const value = b1 + ((x - a1) * (b2 - b1)) / (a2 - a1);
  if (clamp) {
    return Math.max(b1, Math.min(b2, value));
  }

  return value;
}

// ----------
// https://en.wikipedia.org/wiki/Linear_interpolation
export function lerp(x: number, y: number, t: number) {
  return (1 - t) * x + t * y;
}

// ----------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pickRandom(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}

// ----------
// computes the angle in radians with respect to the positive x-axis
export function getRadians(x: number, y: number) {
  return Math.atan2(-y, -x) + Math.PI;
}

// ----------
export function getDistance(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
}

// ----------
export function makeTimeString(
  seconds: number,
  twentyFourHour: boolean = false
) {
  let mark = twentyFourHour ? "" : " AM";
  let hours = seconds / (60 * 60);
  const minutes = (hours - Math.floor(hours)) * 60;
  const remainingSeconds = seconds % 60;

  let minutesString = "" + Math.floor(minutes);
  if (minutesString.length === 1) {
    minutesString = "0" + minutesString;
  }

  let secondsString = "" + Math.floor(remainingSeconds);
  if (secondsString.length === 1) {
    secondsString = "0" + secondsString;
  }

  hours = Math.floor(hours);

  let hoursString: string;
  if (twentyFourHour) {
    hoursString = "" + hours;
    if (hoursString.length === 1) {
      hoursString = "0" + hoursString;
    }
  } else {
    if (hours === 0) {
      hours = 12;
    } else if (hours === 12) {
      mark = " PM";
    } else if (hours >= 13) {
      hours -= 12;
      mark = " PM";
    }

    hoursString = "" + hours;
  }

  const result = hoursString + ":" + minutesString + ":" + secondsString + mark;
  // console.log("time:", seconds, result, hours, minutes, remainingSeconds);
  return result;
}

// ----------
export function getSecondsFromTimeString(timeString: string) {
  const chunks = timeString.split(":");
  const hours = parseFloat(chunks[0]);
  const minutes = parseFloat(chunks[1]);
  const seconds = parseFloat(chunks[2]);
  return hours * 60 * 60 + minutes * 60 + seconds;
}

// ----------
export function importLbm(types: string[]): Promise<LbmData> {
  return new Promise((resolve, _reject) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = types.map((type) => `.${type}`).join(",");

    fileInput.onchange = () => {
      const file = fileInput.files && fileInput.files[0];
      if (file) {
        if (file.type === "application/json") {
          const reader = new FileReader();
          reader.onload = () => {
            const data = JSON.parse(reader.result as string);
            // console.log(data);
            const cycles: LbmCycle[] = data.colorRange.map(
              (range: DPaintJsCycle) => {
                return {
                  low: range.low,
                  high: range.high,
                  rate: range.fps * LBM_CYCLE_RATE_DIVISOR,
                  reverse: range.reverse ? 2 : 0,
                };
              }
            );
            resolve({
              name: data.image.name,
              width: data.image.width,
              height: data.image.height,
              colors: data.palette,
              pixels: data.indexedPixels.flat(),
              cycles,
            });
          };

          reader.readAsText(file);
        } else {
          const formData = new FormData();
          formData.append("fileInput", file);

          fetch("/upload", {
            method: "POST",
            body: formData,
          })
            .then((response) => response.json())
            .then((data) => {
              // console.log("File uploaded successfully:", data, file);
              const { width, height, colors, pixels, cycles } = data;
              const { name } = file;
              resolve({ name, width, height, colors, pixels, cycles });
            })
            .catch((error) => {
              console.error("Error uploading file:", error);
            });
        }
      }
    };

    fileInput.click();
  });
}
