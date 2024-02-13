/* eslint-disable @typescript-eslint/no-unused-vars */
import "./App.css";
import { useEffect, useRef, useState } from "react";
import { World } from "./World";
import Controls from "./Controls";

const world = new World();

function App() {
  const [changeCount, setChangeCount] = useState<number>(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      world.setCanvas(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    world.onChange = () => {
      setChangeCount(changeCount + 1);
    };
  }, [changeCount]);

  return (
    <div className="App">
      {/* <AppContext.Provider value={{ world, setWorld }}> */}
      <canvas ref={canvasRef} />
      <Controls world={world}></Controls>
      {/* </AppContext.Provider> */}
    </div>
  );
}

export default App;
