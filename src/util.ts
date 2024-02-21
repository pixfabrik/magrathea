/* eslint-disable @typescript-eslint/no-unused-vars */

import { LbmData } from "./types";

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
export function makeTimeString(seconds: number) {
  let mark = "am";
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
  if (hours === 0) {
    hours = 12;
  } else if (hours === 12) {
    mark = "pm";
  } else if (hours >= 13) {
    hours -= 12;
    mark = "pm";
  }

  const result = hours + ":" + minutesString + ":" + secondsString + mark;
  // console.log("time:", seconds, result, hours, minutes, remainingSeconds);
  return result;
}

// ----------
export function importLbm(types: string[]): Promise<LbmData> {
  return new Promise((resolve, reject) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = types.map((type) => `.${type}`).join(",");

    fileInput.onchange = () => {
      const file = fileInput.files && fileInput.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("fileInput", file);

        fetch("/upload", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            // console.log("File uploaded successfully:", data);
            resolve(data);
          })
          .catch((error) => {
            console.error("Error uploading file:", error);
          });
      }
    };

    fileInput.click();
  });
}
