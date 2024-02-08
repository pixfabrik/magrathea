import { LbmData } from "./types";

const mainImageStorageKey = "mainImage";

// ----------
// Loads data from local storage and returns it using a promise.
export function loadImage(): Promise<LbmData> {
  return new Promise((resolve) => {
    const data = localStorage.getItem(mainImageStorageKey);
    if (data) {
      resolve(JSON.parse(data));
    }
  });
}

// ----------
export function saveImage(data: LbmData) {
  localStorage.setItem(mainImageStorageKey, JSON.stringify(data));
}
