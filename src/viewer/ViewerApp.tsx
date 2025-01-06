/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import "./ViewerApp.less";
import { useEffect, useRef, useState } from "react";
import WorldRunner from "../WorldRunner";
import ViewerUi from "./ViewerUi";
import ViewerSettings from "./ViewerSettings";

const uiHideDelay = 5000;
let uiHideTimeout: any = 0;

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
  const [showUi, setShowUi] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const canvasRef = useRef(null);

  const startUiHide = () => {
    uiHideTimeout = setTimeout(() => {
      setShowUi(false);
    }, uiHideDelay);
  };

  useEffect(() => {
    if (canvasRef.current) {
      worldRunner.world.setCanvas(canvasRef.current);
    }

    startUiHide();
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
          const newShowUi = !showUi;
          setShowUi(newShowUi);
          clearTimeout(uiHideTimeout);
          if (newShowUi) {
            startUiHide();
          }
        }}
      >
        <canvas ref={canvasRef} />
      </div>
      <ViewerUi
        show={showUi}
        name={worldRunner.world.data.name}
        onSettingsClick={() => {
          setShowSettings(true);
        }}
      />
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
