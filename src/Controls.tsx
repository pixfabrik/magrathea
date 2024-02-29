/* eslint-disable @typescript-eslint/no-unused-vars */
import "./Controls.less";
import React, { useEffect, useState } from "react";
import WorldRunner from "./WorldRunner";
import { OverlayInfo, PaletteInfo } from "./types";
import { getSecondsFromTimeString, importLbm, makeTimeString } from "./util";
import { maxSeconds } from "./vars";

type ControlsProps = {
  worldRunner: WorldRunner;
};

const Controls: React.FC<ControlsProps> = ({ worldRunner }) => {
  const [changeCount, setChangeCount] = useState<number>(0);
  const [paletteAreaOpen, setPaletteAreaOpen] = useState<boolean>(false);
  const [overlayAreaOpen, setOverlayAreaOpen] = useState<boolean>(false);
  const seconds = worldRunner.getSeconds();
  const world = worldRunner.world;

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
          className="time-slider"
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
          Palettes ({world.paletteInfos.length})
        </div>
        {paletteAreaOpen &&
          world.paletteInfos.map(
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
          Overlays ({world.overlays.length})
        </div>
        {overlayAreaOpen &&
          world.overlays.map(
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
      {/* )}
      </AppContext.Consumer> */}
    </div>
  );
};

export default Controls;
