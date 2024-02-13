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
  let minutes = "" + Math.floor((hours - Math.floor(hours)) * 60);
  if (minutes.length === 1) {
    minutes = "0" + minutes;
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

  return hours + ":" + minutes + mark;
}
