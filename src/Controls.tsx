import "./Controls.css";
import React from "react";
// import AppContext, { AppContextProps } from "./AppContext";
import { Image } from "./image";
import { saveImage } from "./storage";

type ControlsProps = {
  image: Image | null;
  setImage: React.Dispatch<React.SetStateAction<Image | null>>;
};

const Controls: React.FC<ControlsProps> = ({ image, setImage }) => {
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
                    if (image) {
                      image.destroy();
                    }

                    setImage(new Image(data));
                    saveImage(data);
                  } else if (/\.bbm$/i.test(data.filename)) {
                    if (image) {
                      image.loadColors(data);
                    }
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
      {/* )}
      </AppContext.Consumer> */}
    </div>
  );
};

export default Controls;
