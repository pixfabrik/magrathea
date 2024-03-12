/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from "lodash";
import seedrandom from "seedrandom";
import World from "./World";
import { maxSeconds } from "./vars";
import { getDateString } from "./util";
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

// ----------
export default class Scheduler {
  world: World;
  eventArgsArray: SchedulerMakeArgs[] = [];
  modeId: number = -1;
  paletteId: number = -1;
  overlayId: number = -1;

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
  getCurrentModeInfo(nowSeconds: number): ModeInfo | null {
    if (this.paletteId > 0) {
      const paletteInfo = this.world.data.paletteInfos.find(
        (palette) => palette.id === this.paletteId
      );

      if (paletteInfo) {
        return {
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
        };
      }
    }

    const modeInfo =
      this.world.data.modes.find((mode) => mode.id === this.modeId) ||
      this.world.data.modes[0] ||
      null;

    return modeInfo;
  }
}
