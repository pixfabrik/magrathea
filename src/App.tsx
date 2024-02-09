/* eslint-disable @typescript-eslint/no-unused-vars */
import "./App.css";
import { LbmData, PaletteInfo } from "./types";
import { useEffect, useRef, useState } from "react";
import { Image } from "./image";
import { loadImage } from "./storage";
import Controls from "./Controls";

const image = new Image();

function App() {
  const [changeCount, setChangeCount] = useState<number>(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      image.setCanvas(canvasRef.current);
    }

    loadImage().then((data: LbmData) => {
      image.loadImage(data);
    });
  }, []);

  useEffect(() => {
    image.onChange = () => {
      setChangeCount(changeCount + 1);
    };
  }, [changeCount]);

  return (
    <div className="App">
      {/* <AppContext.Provider value={{ image, setImage }}> */}
      <canvas ref={canvasRef} />
      <Controls image={image}></Controls>
      {/* </AppContext.Provider> */}
    </div>
  );
}

export default App;
