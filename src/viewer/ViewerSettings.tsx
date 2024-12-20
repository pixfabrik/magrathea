import { useState } from "react";
import World from "../World";
import "./ViewerSettings.less";

type ViewerSettingsProps = {
  world: World;
  onClose: () => void;
};

export default function ViewerSettings(props: ViewerSettingsProps) {
  const [changeCount, setChangeCount] = useState<number>(0);

  return (
    <div className="ViewerSettings">
      <div className="title">Settings</div>
      <div className="controls">
        <label>
          <input
            type="checkbox"
            checked={props.world.viewMode === "letterbox"}
            onChange={() => {
              props.world.setViewMode(
                props.world.viewMode === "letterbox" ? "pan" : "letterbox"
              );
              setChangeCount(changeCount + 1);
            }}
          />{" "}
          Letterbox
        </label>
      </div>
      <div className="spacer" />
      <div className="button close-button" onClick={props.onClose}>
        Close
      </div>
    </div>
  );
}
