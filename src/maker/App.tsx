/* eslint-disable @typescript-eslint/no-unused-vars */
import "./App.less";
import { useEffect, useRef, useState } from "react";
import WorldRunner from "../WorldRunner";
import Controls from "./Controls";

const VERSION = 12;

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

    worldRunner.onStatusChange = () => {
      setChangeCount(changeCount + 1);
    };
  }, [changeCount]);

  return (
    <div className="App">
      {/* <AppContext.Provider value={{ world, setWorld }}> */}
      <div className="top-nav">
        Living Worlds Maker
        {worldRunner.world.data.name ? " - " + worldRunner.world.data.name : ""}
        <div className="version-area">
          <a
            className="version"
            href="https://github.com/pixfabrik/magrathea/blob/main/changelog.md"
            target="_blank"
          >
            v{VERSION}
          </a>{" "}
          <a
            className="version"
            href="https://github.com/pixfabrik/magrathea/wiki"
            target="_blank"
          >
            Help
          </a>
        </div>
      </div>
      <div className="main-area">
        <div className="canvas-area">
          <canvas ref={canvasRef} />
        </div>
        <Controls worldRunner={worldRunner}></Controls>
      </div>
      <div className="status-bar">{worldRunner.status}</div>
      {/* </AppContext.Provider> */}
    </div>
  );
}

export default App;
