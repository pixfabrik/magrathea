import World from "./World";

// ----------
export default class WorldRunner {
  world: World;
  status: string = "";
  midnightSeconds: number;
  offsetSeconds = 0;
  onChange: (() => void) | null = null;
  onStatusChange: (() => void) | null = null;

  // ----------
  constructor(sceneUrl: string | null = null) {
    this.world = new World(sceneUrl);

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
    const seconds = this.getRealSeconds() + this.offsetSeconds;
    // console.log(seconds);
    return seconds;
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
      const newStatus = this.world.frame(nowSeconds);
      if (newStatus !== this.status) {
        this.status = newStatus;
        if (this.onStatusChange) {
          this.onStatusChange();
        }
      }
    };

    requestAnimationFrame(frame);
  }
}
