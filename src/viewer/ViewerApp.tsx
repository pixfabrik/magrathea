/* eslint-disable @typescript-eslint/no-unused-vars */
import "./ViewerApp.less";
import { useEffect, useRef, useState } from "react";
import WorldRunner from "../WorldRunner";
import ViewerUi from "./ViewerUi";
import ViewerSettings from "./ViewerSettings";

const params = new URLSearchParams(window.location.search);
const scene = params.get("scene");
let sceneUrl = "";
if (scene) {
  sceneUrl = `scenes/${scene}.json`;
}

const worldRunner = new WorldRunner(sceneUrl);
worldRunner.world.setViewMode("pan");

function ViewerApp() {
  const [changeCount, setChangeCount] = useState<number>(0);
  const [showUi, setShowUi] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
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
      <div
        className="canvas-area"
        onClick={() => {
          setShowUi(!showUi);
        }}
      >
        <canvas ref={canvasRef} />
      </div>
      {showUi && (
        <ViewerUi
          name={worldRunner.world.data.name}
          onSettingsClick={() => {
            setShowSettings(true);
          }}
        />
      )}
      {showSettings && (
        <ViewerSettings
          world={worldRunner.world}
          onClose={() => {
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}

export default ViewerApp;
