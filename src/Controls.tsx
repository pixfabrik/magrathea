import "./Controls.less";
import React from "react";
// import AppContext, { AppContextProps } from "./AppContext";
import { Image } from "./image";
// import { saveImage } from "./storage";
import { PaletteInfo } from "./types";
import { makeTimeString } from "./util";

type ControlsProps = {
  image: Image;
};

const Controls: React.FC<ControlsProps> = ({ image }) => {
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
                    image.loadImage(data);
                    // saveImage(data);
                  } else if (/\.bbm$/i.test(data.filename)) {
                    image.loadColors(data);
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
      <div>
        {image &&
          image.paletteInfos.map((paletteInfo: PaletteInfo) => {
            return (
              <div key={paletteInfo.startSeconds} className="palette-info">
                <div>Start: {makeTimeString(paletteInfo.startSeconds)}</div>
                <div>End: {makeTimeString(paletteInfo.endSeconds)}</div>
                <div className="colors">
                  {paletteInfo.colors.map((color: number[], index: number) => {
                    return (
                      <div
                        className="color"
                        key={index}
                        style={{
                          backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                        }}
                      ></div>
                    );
                  })}
                </div>
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
