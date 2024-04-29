import { LbmData } from "./types";
import React, { useEffect, useState } from "react";

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

// ----------
export function useStorageState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const value = localStorage.getItem(key);
    if (value) {
      return JSON.parse(value);
    }
    return defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
