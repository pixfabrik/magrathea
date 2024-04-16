/* eslint-disable @typescript-eslint/no-unused-vars */
import "./EditableText.less";
import classNames from "classnames";
import React, { useEffect, useState } from "react";

type EditableTextProps = {
  className: string;
  value: string;
  onChange: (value: string) => void;
};

// ----------
const EditableText: React.FC<EditableTextProps> = ({
  className,
  value,
  onChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  return (
    <div className={classNames("EditableText", className)}>
      {!isEditing && (
        <div
          onClick={() => {
            setIsEditing(true);
          }}
        >
          {text}
        </div>
      )}
      {isEditing && (
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          }}
          onBlur={() => {
            setIsEditing(false);
            onChange(text);
            setText(value);
          }}
        />
      )}
    </div>
  );
};

export default EditableText;
