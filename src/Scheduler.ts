/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from "lodash";

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
  events: SchedulerMakeArgs[] = [];

  // ----------
  constructor() {}

  // ----------
  make(args: SchedulerMakeArgs) {
    this.events = [args];
  }

  // ----------
  getEvents(nowSeconds: number) {
    let scheduleEvents = this.events.map((event) => {
      if (event.progress !== undefined) {
        return {
          eventInfoId: event.eventInfoId,
          progress: event.progress,
        };
      }

      if (event.startSeconds !== undefined) {
        const endSeconds = event.startSeconds + 5;
        const progress =
          (nowSeconds - event.startSeconds) / (endSeconds - event.startSeconds);
        if (progress >= 0 && progress <= 1) {
          return {
            eventInfoId: event.eventInfoId,
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
