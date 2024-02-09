import "./App.css";
import { LbmData } from "./types";
import { useEffect, useRef, useState } from "react";
import { Image } from "./image";
import { loadImage, saveImage } from "./storage";

function App() {
  const [image, setImage] = useState<Image | null>(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadImage().then((data: LbmData) => {
      if (canvasRef.current) {
        setImage(new Image(data, canvasRef.current));
      }
    });
  }, []);

  return (
    <div className="App">
      <div>
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
                    if (canvasRef.current) {
                      if (/\.lbm$/i.test(data.filename)) {
                        if (image) {
                          image.destroy();
                        }

                        setImage(new Image(data, canvasRef.current));
                        saveImage(data);
                      } else if (/\.bbm$/i.test(data.filename)) {
                        if (image) {
                          image.loadColors(data);
                        }
                      } else {
                        console.error("Unknown file type:", data.filename);
                      }
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
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default App;
