/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from "lodash";
import World from "./World";

export type SchedulerMakeArgs = {
  eventInfoId: number;
  progress?: number;
  startSeconds?: number;
};

export type ScheduleEvent = {
  eventInfoId: number;
  progress: number;
};

// ----------
export default class Scheduler {
  world: World;
  eventArgsArray: SchedulerMakeArgs[] = [];

  // ----------
  constructor(world: World) {
    this.world = world;
  }

  // ----------
  make(args: SchedulerMakeArgs) {
    this.eventArgsArray = [args];
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

      const eventInfo = this.world.getEventInfo(eventArgs.eventInfoId);
      if (!eventInfo) {
        return null;
      }

      if (eventArgs.startSeconds !== undefined) {
        const endSeconds = eventArgs.startSeconds + eventInfo.durationSeconds;
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
}
