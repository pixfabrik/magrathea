/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from "lodash";
import seedrandom from "seedrandom";
import World from "./World";
import { maxSeconds } from "./vars";
import { getDateString } from "./util";

export type SchedulerMakeArgs = {
  eventInfoId: number;
  progress?: number;
  startSeconds?: number;
  durationSeconds?: number;
};

export type ScheduleEvent = {
  eventInfoId: number;
  progress: number;
};

// ----------
export default class Scheduler {
  world: World;
  eventArgsArray: SchedulerMakeArgs[] = [];
  modeId: number = -1;

  // ----------
  constructor(world: World) {
    this.world = world;
  }

  // ----------
  clear() {
    this.eventArgsArray = [];
  }

  // ----------
  setMode(modeId: number) {
    this.modeId = modeId;
  }

  // ----------
  make(args: SchedulerMakeArgs) {
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
  getEvents(nowSeconds: number) {
    let scheduleEvents = this.eventArgsArray.map((eventArgs) => {
      if (eventArgs.progress !== undefined) {
        return {
          eventInfoId: eventArgs.eventInfoId,
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
            eventInfoId: eventArgs.eventInfoId,
            progress: progress,
          };
        }
      }

      return null;
    });

    scheduleEvents = _.compact(scheduleEvents);
    // console.log(scheduleEvents);

    return scheduleEvents;
  }

  // ----------
  getCurrentModeInfo(nowSeconds: number) {
    const modeInfo = this.world.data.modes.find(
      (mode) => mode.id === this.modeId
    );

    return modeInfo || this.world.data.modes[0] || null;
  }
}
