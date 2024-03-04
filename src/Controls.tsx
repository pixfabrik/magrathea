/* eslint-disable @typescript-eslint/no-unused-vars */
import "./Controls.less";
import React, { useEffect, useState } from "react";
import WorldRunner from "./WorldRunner";
import { EventInfo, OverlayInfo, PaletteInfo } from "./WorldData";
import { getSecondsFromTimeString, importLbm, makeTimeString } from "./util";
import { maxSeconds } from "./vars";

type ControlsProps = {
  worldRunner: WorldRunner;
};

const Controls: React.FC<ControlsProps> = ({ worldRunner }) => {
  const [changeCount, setChangeCount] = useState<number>(0);
  const [paletteAreaOpen, setPaletteAreaOpen] = useState<boolean>(false);
  const [overlayAreaOpen, setOverlayAreaOpen] = useState<boolean>(false);
  const [eventAreaOpen, setEventAreaOpen] = useState<boolean>(false);
  const seconds = worldRunner.getSeconds();
  const world = worldRunner.world;
  const worldData = world.data;

  useEffect(() => {
    worldRunner.onChange = () => {
      setChangeCount(changeCount + 1);
    };
  }, [changeCount, worldRunner]);

  setTimeout(() => {
    setChangeCount(changeCount + 1);
  }, 1000);

  return (
    <div className="Controls">
      {/* <AppContext.Consumer>
        {(props: AppContextProps) => ( */}
      <div className="top-area">
        <button
          onClick={async () => {
            try {
              const data = await importLbm(["lbm", "json"]);
              world.loadImage(data);
            } catch (err) {
              alert(err);
            }
          }}
        >
          Load Base Pixels (LBM, DPaint.JSON)
        </button>
        <button
          onClick={async () => {
            try {
              const data = await importLbm(["lbm", "json"]);
              world.loadOverlay(data);
            } catch (err) {
              alert(err);
            }
          }}
        >
          Load Overlay Pixels (LBM, DPaint.JSON)
        </button>
        <button
          onClick={async () => {
            try {
              const data = await importLbm(["bbm", "lbm", "json"]);
              world.loadColors(data);
            } catch (err) {
              alert(err);
            }
          }}
        >
          Load Palette (LBM, BBM, DPaint.JSON)
        </button>
        <button
          onClick={async () => {
            world.doImport();
          }}
        >
          Import World
        </button>
        <button
          onClick={async () => {
            world.doExport();
          }}
        >
          Export World
        </button>
        <div>{makeTimeString(seconds)}</div>
        <input
          className="slider"
          type="range"
          min="0"
          max={maxSeconds - 1}
          value={seconds}
          onChange={(event) => {
            worldRunner.setSeconds(parseFloat(event.currentTarget.value));
          }}
        />
      </div>
      <div className="resource-area">
        <div
          className="area-title"
          onClick={() => {
            setPaletteAreaOpen(!paletteAreaOpen);
          }}
        >
          Palettes ({worldData.paletteInfos.length})
        </div>
        {paletteAreaOpen &&
          worldData.paletteInfos.map(
            (paletteInfo: PaletteInfo, paletteIndex: number) => {
              return (
                <div
                  key={paletteInfo.id}
                  className={`resource-info ${
                    world.paletteStatuses[paletteIndex] === "bad" ? "bad" : ""
                  }`}
                >
                  <div className="name">{paletteInfo.name}</div>
                  <div>
                    Start:{" "}
                    <input
                      className="start-seconds"
                      type="time"
                      step="1"
                      value={makeTimeString(paletteInfo.startSeconds, true)}
                      onChange={(event) => {
                        world.updatePalette(paletteIndex, {
                          startSeconds: getSecondsFromTimeString(
                            event.currentTarget.value
                          ),
                        });
                      }}
                    />
                  </div>
                  <div>
                    End:{" "}
                    <input
                      type="time"
                      step="1"
                      value={makeTimeString(paletteInfo.endSeconds, true)}
                      onChange={(event) => {
                        world.updatePalette(paletteIndex, {
                          endSeconds: getSecondsFromTimeString(
                            event.currentTarget.value
                          ),
                        });
                      }}
                    />
                  </div>
                  <div className="colors">
                    {paletteInfo.colors.map(
                      (color: number[], index: number) => {
                        return (
                          <div
                            className="color"
                            key={index}
                            style={{
                              backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                            }}
                          ></div>
                        );
                      }
                    )}
                  </div>
                  <button
                    onClick={() => {
                      worldRunner.setSeconds(paletteInfo.startSeconds);
                    }}
                  >
                    Go To Start
                  </button>
                  <button
                    onClick={() => {
                      worldRunner.setSeconds(paletteInfo.endSeconds);
                    }}
                  >
                    Go To End
                  </button>
                  <button
                    onClick={() => {
                      world.deletePalette(paletteIndex);
                    }}
                  >
                    Delete
                  </button>
                </div>
              );
            }
          )}
      </div>
      <div className="resource-area">
        <div
          className="area-title"
          onClick={() => {
            setOverlayAreaOpen(!overlayAreaOpen);
          }}
        >
          Overlays ({worldData.overlays.length})
        </div>
        {overlayAreaOpen &&
          worldData.overlays.map(
            (overlayInfo: OverlayInfo, overlayIndex: number) => {
              return (
                <div key={overlayInfo.id} className={`resource-info`}>
                  <div className="name">{overlayInfo.name}</div>
                  <button
                    onClick={() => {
                      world.deleteOverlay(overlayIndex);
                    }}
                  >
                    Delete
                  </button>
                </div>
              );
            }
          )}
      </div>
      <div className="resource-area">
        <div
          className="area-title"
          onClick={() => {
            setEventAreaOpen(!eventAreaOpen);
          }}
        >
          Events ({worldData.events.length})
          <button
            onClick={(event) => {
              event.stopPropagation();
              setEventAreaOpen(true);
              const eventInfo = world.addEvent();

              world.scheduler.make({
                eventInfoId: eventInfo.id,
                progress: 0,
              });
            }}
          >
            Add
          </button>
        </div>
        {eventAreaOpen &&
          worldData.events.map((eventInfo: EventInfo, eventIndex: number) => {
            return (
              <div key={eventInfo.id} className={`resource-info`}>
                <div className="name">{eventInfo.name}</div>
                Overlay:{" "}
                <select
                  value={eventInfo.overlayId}
                  onChange={(event) => {
                    world.updateEvent(eventIndex, {
                      overlayId: parseInt(event.currentTarget.value),
                    });

                    world.scheduler.make({
                      eventInfoId: eventInfo.id,
                      progress: 0,
                    });
                  }}
                >
                  <option key={-1} value={-1}>
                    None
                  </option>
                  {worldData.overlays.map((overlayInfo: OverlayInfo) => {
                    return (
                      <option key={overlayInfo.id} value={overlayInfo.id}>
                        {overlayInfo.name}
                      </option>
                    );
                  })}
                </select>
                <div>
                  Duration: {eventInfo.durationSeconds}{" "}
                  <input
                    className="slider"
                    type="range"
                    min="0"
                    max="600"
                    value={eventInfo.durationSeconds}
                    onChange={(event) => {
                      world.updateEvent(eventIndex, {
                        durationSeconds: parseInt(event.currentTarget.value),
                      });

                      world.scheduler.make({
                        eventInfoId: eventInfo.id,
                        progress: 0,
                      });
                    }}
                  />
                </div>
                <div>
                  Start X:{" "}
                  <input
                    className="slider"
                    type="range"
                    min="0"
                    max={worldData.width}
                    value={eventInfo.startPosition.x}
                    onChange={(event) => {
                      world.updateEvent(eventIndex, {
                        startPosition: {
                          x: parseInt(event.currentTarget.value),
                          y: eventInfo.startPosition.y,
                        },
                      });

                      world.scheduler.make({
                        eventInfoId: eventInfo.id,
                        progress: 0,
                      });
                    }}
                  />
                </div>
                <div>
                  Start Y:{" "}
                  <input
                    className="slider"
                    type="range"
                    min="0"
                    max={worldData.width}
                    value={eventInfo.startPosition.y}
                    onChange={(event) => {
                      world.updateEvent(eventIndex, {
                        startPosition: {
                          x: eventInfo.startPosition.x,
                          y: parseInt(event.currentTarget.value),
                        },
                      });

                      world.scheduler.make({
                        eventInfoId: eventInfo.id,
                        progress: 0,
                      });
                    }}
                  />
                </div>
                <div>
                  End X:{" "}
                  <input
                    className="slider"
                    type="range"
                    min="0"
                    max={worldData.width}
                    value={eventInfo.endPosition.x}
                    onChange={(event) => {
                      world.updateEvent(eventIndex, {
                        endPosition: {
                          x: parseInt(event.currentTarget.value),
                          y: eventInfo.endPosition.y,
                        },
                      });

                      world.scheduler.make({
                        eventInfoId: eventInfo.id,
                        progress: 1,
                      });
                    }}
                  />
                </div>
                <div>
                  End Y:{" "}
                  <input
                    className="slider"
                    type="range"
                    min="0"
                    max={worldData.width}
                    value={eventInfo.endPosition.y}
                    onChange={(event) => {
                      world.updateEvent(eventIndex, {
                        endPosition: {
                          x: eventInfo.endPosition.x,
                          y: parseInt(event.currentTarget.value),
                        },
                      });

                      world.scheduler.make({
                        eventInfoId: eventInfo.id,
                        progress: 1,
                      });
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    world.scheduler.make({
                      eventInfoId: eventInfo.id,
                      startSeconds: seconds,
                    });
                  }}
                >
                  Trigger
                </button>
                <button
                  onClick={() => {
                    world.deleteEvent(eventIndex);
                  }}
                >
                  Delete
                </button>
              </div>
            );
          })}
      </div>
      {/* )}
      </AppContext.Consumer> */}
    </div>
  );
};

export default Controls;
