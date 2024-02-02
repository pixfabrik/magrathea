import "./App.css";
import { useRef } from "react";
import { loadImage } from "./image.ts";

function App() {
  const canvasRef = useRef(null);

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
                    // console.log("File uploaded successfully:", data);
                    if (canvasRef.current) {
                      loadImage(data, canvasRef.current);
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
