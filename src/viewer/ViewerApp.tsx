/* eslint-disable @typescript-eslint/no-unused-vars */
import "./ViewerApp.less";
import { useEffect, useRef, useState } from "react";
import WorldRunner from "../WorldRunner";

const worldRunner = new WorldRunner();

function ViewerApp() {
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
    <div className="ViewerApp">
      <div className="top-nav">
        Living Worlds Viewer
        {worldRunner.world.data.name ? " - " + worldRunner.world.data.name : ""}
      </div>
      <div className="main-area">
        <div className="canvas-area">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}

export default ViewerApp;
