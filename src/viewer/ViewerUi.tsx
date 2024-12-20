import "./ViewerUi.less";

type ViewerUiProps = {
  name: string;
  onSettingsClick: () => void;
};

export default function ViewerUi(props: ViewerUiProps) {
  return (
    <div className="ViewerUi">
      <div className="name">{props.name}</div>
      <div className="button settings-button" onClick={props.onSettingsClick}>
        Settings
      </div>
    </div>
  );
}
