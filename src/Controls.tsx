import "./Controls.less";
import React, { useEffect, useState } from "react";
import WorldRunner from "./WorldRunner";
import { PaletteInfo } from "./types";
import { importLbm, makeTimeString } from "./util";
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
  }, [changeCount]);

  const seconds = worldRunner.getSeconds();

  return (
    <div className="Controls">
      {/* <AppContext.Consumer>
        {(props: AppContextProps) => ( */}
      <div className="top-area">
        <button
          onClick={async () => {
            const data = await importLbm(["lbm"]);
            worldRunner.world.loadImage(data);
          }}
        >
          Load Pixels (LBM)
        </button>
        <button
          onClick={async () => {
            const data = await importLbm(["bbm", "lbm"]);
            worldRunner.world.loadColors(data);
          }}
        >
          Load Palette (LBM, BBM)
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
                <div key={paletteInfo.startSeconds} className="palette-info">
                  <div>Start: {makeTimeString(paletteInfo.startSeconds)}</div>
                  <div>End: {makeTimeString(paletteInfo.endSeconds)}</div>
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
