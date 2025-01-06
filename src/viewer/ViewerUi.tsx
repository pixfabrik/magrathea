import { useEffect, useState } from "react";
import "./ViewerUi.less";

type ViewerUiProps = {
  show: boolean;
  name: string;
  onSettingsClick: () => void;
};

export default function ViewerUi(props: ViewerUiProps) {
  const [opacity, setOpacity] = useState<number>(props.show ? 1 : 0);

  useEffect(() => {
    if (props.show) {
      setOpacity(1);
    } else {
      const frame = () => {
        setOpacity((prevOpacity) => {
          const newOpacity = Math.max(0, prevOpacity - 0.01);
          if (newOpacity > 0) {
            requestAnimationFrame(frame);
          }

          return newOpacity;
        });
      };

      requestAnimationFrame(frame);
    }
  }, [props.show]);

  if (!opacity) {
    return null;
  }

  return (
    <div
      className="ViewerUi"
      style={{
        opacity,
      }}
    >
      <div className="name">{props.name}</div>
      <div className="button settings-button" onClick={props.onSettingsClick}>
        Settings
      </div>
    </div>
  );
}
