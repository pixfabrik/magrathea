import "./Controls.less";
import React, { useEffect, useState } from "react";
import WorldRunner from "./WorldRunner";
import { PaletteInfo } from "./types";
import { makeTimeString } from "./util";
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
      <div
        className="upload-button"
        onClick={() => {
          const fileInput = document.createElement("input");
          fileInput.type = "file";

          fileInput.onchange = () => {
            const file = fileInput.files && fileInput.files[0];
            if (file) {
              const formData = new FormData();
              formData.append("fileInput", file);

              fetch("/upload", {
                method: "POST",
                body: formData,
              })
                .then((response) => response.json())
                .then((data) => {
                  console.log("File uploaded successfully:", data);
                  if (/\.lbm$/i.test(data.filename)) {
                    worldRunner.world.loadImage(data);
                    // saveImage(data);
                  } else if (/\.bbm$/i.test(data.filename)) {
                    worldRunner.world.loadColors(data);
                  } else {
                    console.error("Unknown file type:", data.filename);
                  }
                })
                .catch((error) => {
                  console.error("Error uploading file:", error);
                });
            }
          };

          fileInput.click();
        }}
      >
        Upload an LBM file
      </div>
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
                    Go To
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
