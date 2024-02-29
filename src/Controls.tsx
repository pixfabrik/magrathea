import "./Controls.less";
import React, { useEffect, useState } from "react";
import WorldRunner from "./WorldRunner";
import { PaletteInfo } from "./types";
import { getSecondsFromTimeString, importLbm, makeTimeString } from "./util";
import { maxSeconds } from "./vars";

type ControlsProps = {
  worldRunner: WorldRunner;
};

const Controls: React.FC<ControlsProps> = ({ worldRunner }) => {
  const [changeCount, setChangeCount] = useState<number>(0);

  useEffect(() => {
    worldRunner.onChange = () => {
      setChangeCount(changeCount + 1);
    };
  }, [changeCount, worldRunner]);

  const seconds = worldRunner.getSeconds();

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
              worldRunner.world.loadImage(data);
            } catch (err) {
              alert(err);
            }
          }}
        >
          Load Pixels (LBM, DPaint.JSON)
        </button>
        <button
          onClick={async () => {
            try {
              const data = await importLbm(["bbm", "lbm", "json"]);
              worldRunner.world.loadColors(data);
            } catch (err) {
              alert(err);
            }
          }}
        >
          Load Palette (LBM, BBM, DPaint.JSON)
        </button>
        <button
          onClick={async () => {
            worldRunner.world.doImport();
          }}
        >
          Import World
        </button>
        <button
          onClick={async () => {
            worldRunner.world.doExport();
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
      <div className="palette-area">
        {worldRunner.world &&
          worldRunner.world.paletteInfos.map(
            (paletteInfo: PaletteInfo, paletteIndex: number) => {
              return (
                <div
                  key={paletteInfo.id}
                  className={`palette-info ${
                    worldRunner.world.paletteStatuses[paletteIndex] === "bad"
                      ? "bad"
                      : ""
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
                        worldRunner.world.updatePalette(paletteIndex, {
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
                        worldRunner.world.updatePalette(paletteIndex, {
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
                      worldRunner.world.deletePalette(paletteIndex);
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
