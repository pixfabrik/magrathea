import "./App.css";
import { LbmData } from "./types";
import { useEffect, useRef, useState } from "react";
import { Image } from "./image";
import { loadImage } from "./storage";
import Controls from "./Controls";

function App() {
  const [image, setImage] = useState<Image | null>(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadImage().then((data: LbmData) => {
      if (canvasRef.current) {
        setImage(new Image(data));
      }
    });
  }, []);

  useEffect(() => {
    if (image && canvasRef.current) {
      image.setCanvas(canvasRef.current);
    }
  }, [image]);

  return (
    <div className="App">
      {/* <AppContext.Provider value={{ image, setImage }}> */}
      <canvas ref={canvasRef} />
      <Controls image={image} setImage={setImage}></Controls>
      {/* </AppContext.Provider> */}
    </div>
  );
}

export default App;
