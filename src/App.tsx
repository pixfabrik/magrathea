/* eslint-disable @typescript-eslint/no-unused-vars */
import "./App.css";
import { useEffect, useRef, useState } from "react";
import WorldRunner from "./WorldRunner";
import Controls from "./Controls";

const worldRunner = new WorldRunner();

function App() {
  const [changeCount, setChangeCount] = useState<number>(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      worldRunner.world.setCanvas(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    worldRunner.world.onChange = () => {
      setChangeCount(changeCount + 1);
    };
  }, [changeCount]);

  return (
    <div className="App">
      {/* <AppContext.Provider value={{ world, setWorld }}> */}
      <canvas ref={canvasRef} />
      <Controls worldRunner={worldRunner}></Controls>
      {/* </AppContext.Provider> */}
    </div>
  );
}

export default App;
