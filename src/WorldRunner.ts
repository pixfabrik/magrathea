import World from "./World";

// ----------
export default class WorldRunner {
  world: World;
  midnightSeconds: number;
  offsetSeconds = 0;
  onChange: (() => void) | null = null;

  // ----------
  constructor() {
    this.world = new World();

    const now = new Date();
    this.midnightSeconds =
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() /
      1000;

    this.startAnimation();
  }

  // ----------
  getRealSeconds() {
    return Date.now() / 1000 - this.midnightSeconds;
  }

  // ----------
  getSeconds() {
    return this.getRealSeconds() + this.offsetSeconds;
  }

  // ----------
  setSeconds(seconds: number) {
    this.offsetSeconds = seconds - this.getRealSeconds();
    if (this.onChange) {
      this.onChange();
    }
  }

  // ----------
  startAnimation() {
    const frame = () => {
      requestAnimationFrame(frame);

      const nowSeconds = this.getSeconds();
      this.world.frame(nowSeconds);
    };

    requestAnimationFrame(frame);
  }
}
