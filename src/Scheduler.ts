/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from "lodash";
import seedrandom from "seedrandom";
import World from "./World";
import { maxSeconds } from "./vars";
import { getDateString, lerp, mapLinear } from "./util";
import { EventInfo, ModeInfo } from "./WorldData";

export type SchedulerMakeArgs = {
  eventInfoId: number;
  progress?: number;
  startSeconds?: number;
  durationSeconds?: number;
};

export type ScheduleEvent = {
  eventInfo: EventInfo;
  progress: number;
};

export type ModePlan = {
  modeId: number;
  startSeconds: number;
  endSeconds: number;
};

export type CurrentModeInfos = {
  startModeInfo: ModeInfo | null;
  endModeInfo: ModeInfo | null;
  progress: number;
};

// ----------
export default class Scheduler {
  world: World;
  eventArgsArray: SchedulerMakeArgs[] = [];
  modeId: number = -1;
  paletteId: number = -1;
  overlayId: number = -1;
  modePlans: ModePlan[] = [];

  // ----------
  constructor(world: World) {
    this.world = world;
  }

  // ----------
  clear() {
    this.modeId = -1;
    this.paletteId = -1;
    this.overlayId = -1;
    this.eventArgsArray = [];
    this.modePlans = [];
  }

  // ----------
  setMode(modeId: number) {
    this.clear();
    this.modeId = modeId;
  }

  // ----------
  setPalette(paletteId: number) {
    this.clear();
    this.paletteId = paletteId;
  }

  // ----------
  setOverlay(overlayId: number) {
    this.clear();
    this.overlayId = overlayId;
  }

  // ----------
  make(args: SchedulerMakeArgs) {
    this.clear();

    if (args.startSeconds !== undefined && args.durationSeconds === undefined) {
      const eventInfo = this.world.getEventInfo(args.eventInfoId);
      if (eventInfo) {
        args.durationSeconds = eventInfo.durationSeconds;
      }
    }

    this.eventArgsArray = [args];
  }

  // ----------
  makeDay() {
    this.clear();

    const random = seedrandom(getDateString());

    // Modes
    this.modePlans = [];

    const modeInfos = this.world.data.modes.filter((modeInfo) => {
      return modeInfo.modePaletteInfos.some(
        (modePaletteInfo) => modePaletteInfo.paletteId !== -1
      );
    });

    if (modeInfos.length) {
      let previousModePlan: ModePlan | null = null;
      for (let seconds = 0; seconds < maxSeconds; ) {
        const modeInfo = modeInfos[Math.floor(random() * modeInfos.length)];

        const durationSeconds = Math.round(60 * 60 * (1 + random() * 3));
        const gapSeconds = Math.round(lerp(60 * 5, 60 * 30, random()));

        const modePlan = {
          modeId: modeInfo.id,
          startSeconds: seconds,
          endSeconds: Math.min(seconds + durationSeconds, maxSeconds),
        };

        if (previousModePlan && previousModePlan.modeId === modePlan.modeId) {
          previousModePlan.endSeconds = modePlan.endSeconds;
        } else {
          this.modePlans.push(modePlan);
          previousModePlan = modePlan;
        }

        seconds += durationSeconds + gapSeconds;
      }
    }

    // Events
    this.world.data.events.forEach((eventInfo) => {
      for (let seconds = 0; seconds < maxSeconds; ) {
        const startSeconds = seconds + random() * 60 * 60;
        const durationSeconds = eventInfo.durationSeconds;
        if (startSeconds + durationSeconds > maxSeconds) {
          break;
        }

        this.eventArgsArray.push({
          eventInfoId: eventInfo.id,
          startSeconds,
          durationSeconds,
        });

        seconds = startSeconds + durationSeconds;
      }
    });

    this.eventArgsArray = _.sortBy(this.eventArgsArray, (eventArgs) => {
      return eventArgs.startSeconds;
    });

    // Logging
    // console.log("modePlans", this.modePlans);
    // console.log("eventArgsArray", this.eventArgsArray);
  }

  // ----------
  getNextEventStartSeconds(nowSeconds: number) {
    for (const eventArgs of this.eventArgsArray) {
      if (eventArgs.startSeconds !== undefined) {
        if (eventArgs.startSeconds > nowSeconds) {
          return eventArgs.startSeconds;
        }
      }
    }

    return -1;
  }

  // ----------
  getEvents(nowSeconds: number): ScheduleEvent[] {
    const scheduleEventsFromArgs = this.eventArgsArray.map((eventArgs) => {
      const eventInfo = this.world.data.events.find(
        (eventInfo) => eventInfo.id === eventArgs.eventInfoId
      );

      if (!eventInfo) {
        return null;
      }

      if (eventArgs.progress !== undefined) {
        return {
          eventInfo,
          progress: eventArgs.progress,
        };
      }

      if (
        eventArgs.startSeconds !== undefined &&
        eventArgs.durationSeconds !== undefined
      ) {
        const endSeconds = eventArgs.startSeconds + eventArgs.durationSeconds;
        const progress =
          (nowSeconds - eventArgs.startSeconds) /
          (endSeconds - eventArgs.startSeconds);
        if (progress >= 0 && progress <= 1) {
          return {
            eventInfo,
            progress: progress,
          };
        }
      }

      return null;
    });

    const scheduleEvents: ScheduleEvent[] = _.compact(scheduleEventsFromArgs);

    if (this.overlayId > 0) {
      scheduleEvents.push({
        progress: 0,
        eventInfo: {
          id: 0,
          name: "",
          durationSeconds: maxSeconds,
          overlayId: this.overlayId,
          startPosition: { x: 0, y: 0 },
          endPosition: { x: 0, y: 0 },
        },
      });
    }

    // console.log(scheduleEvents);

    return scheduleEvents;
  }

  // ----------
  getCurrentModeInfos(nowSeconds: number) {
    // Explicit palette?
    if (this.paletteId > 0) {
      const paletteInfo = this.world.data.paletteInfos.find(
        (palette) => palette.id === this.paletteId
      );

      if (paletteInfo) {
        return {
          startModeInfo: {
            id: 0,
            name: "",
            modePaletteInfos: [
              {
                id: 0,
                paletteId: paletteInfo.id,
                startSeconds: 0,
                endSeconds: maxSeconds,
              },
            ],
          },
          endModeInfo: null,
          progress: 0,
        };
      }
    }

    // Explicit mode?
    if (this.modeId < 0) {
      const modeInfo = this.world.data.modes.find(
        (mode) => mode.id === this.modeId
      );

      if (modeInfo) {
        return { startModeInfo: modeInfo, endModeInfo: null, progress: 0 };
      }
    }

    // Figure out from mode plans
    let startModePlan: ModePlan | null = null;
    let endModePlan: ModePlan | null = null;
    let startModeInfo: ModeInfo | null = null;
    let endModeInfo: ModeInfo | null = null;

    for (const modePlan of this.modePlans) {
      if (nowSeconds >= modePlan.startSeconds) {
        startModePlan = modePlan;

        if (nowSeconds < modePlan.endSeconds) {
          endModePlan = null;
          break;
        }
      } else if (startModePlan) {
        endModePlan = modePlan;
        break;
      } else {
        startModePlan = modePlan;
        break;
      }
    }

    if (startModePlan) {
      startModeInfo =
        this.world.data.modes.find(
          (modeInfo) => modeInfo.id === startModePlan!.modeId
        ) || null;
    }

    if (endModePlan) {
      endModeInfo =
        this.world.data.modes.find(
          (modeInfo) => modeInfo.id === endModePlan!.modeId
        ) || null;
    }

    if (startModeInfo) {
      if (endModeInfo && startModePlan && endModePlan) {
        const progress = mapLinear(
          nowSeconds,
          startModePlan.endSeconds,
          endModePlan.startSeconds,
          0,
          1,
          true
        );

        return {
          startModeInfo,
          endModeInfo,
          progress,
        };
      } else {
        return { startModeInfo, endModeInfo, progress: 0 };
      }
    }

    // No mode plans, just use the first mode
    const modeInfo = this.world.data.modes[0] || null;
    return { startModeInfo: modeInfo, endModeInfo: null, progress: 0 };
  }
}
